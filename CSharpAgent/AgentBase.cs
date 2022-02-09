﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

using PlanetWars.Shared;

namespace CSharpAgent
{
    public class AgentBase
    {
        private bool _isRunning = false;
        private readonly HttpClient _client = null;

        private List<MoveRequest> _pendingMoveRequests = new List<MoveRequest>();

        protected long TimeToNextTurn { get; set; }
        protected int CurrentTurn { get; set; }
        protected int GameId { get; set; }

        // string guid that acts as an authorization token, definitely not crypto secure
        public string AuthToken { get; set; }
        public string Name { get; set; }
        public int LastTurn { get; private set; }
        public int MyId { get; private set; }

        public AgentBase(string name, string endpoint)
        {
            Name = name;
            // connect to api and handle gzip compressed messasges
            _client = new HttpClient() { BaseAddress = new Uri(endpoint) };
            _client.DefaultRequestHeaders.Accept.Clear();
            _client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        public void SendFleet(int sourcePlanetId, int destinationPlanetId, int numShips)
        {
            var moveRequest = new MoveRequest()
            {
                AuthToken = AuthToken,
                GameId = GameId,
                SourcePlanetId = sourcePlanetId,
                DestinationPlanetId = destinationPlanetId,
                NumberOfShips = numShips
            };
            _pendingMoveRequests.Add(moveRequest);
            Console.WriteLine($"> Move {numShips} ships from planet {sourcePlanetId} to planet {destinationPlanetId}");
        }

        protected async Task<LogonResult> Logon()
        {
            var response = await _client.PostAsJsonAsync("api/logon", new LogonRequest()
            {
                AgentName = Name
            });
            var result = await response.Content.ReadAsAsync<LogonResult>();
            if (!result.Success)
            {
                Console.WriteLine($"Error connecting to server: {result.Message}");
                throw new Exception("Connection failed");
            }
            AuthToken = result.AuthToken;
            GameId = result.GameId;
            MyId = result.Id;
            TimeToNextTurn = (long)result.GameStart.Subtract(DateTime.UtcNow).TotalMilliseconds;
            Console.WriteLine($"[{DateTime.Now.ToLongTimeString()}] Connected to {_client.BaseAddress}");
            Console.WriteLine($"Your game ID is {result.GameId} and your player ID is {MyId}");
            Console.WriteLine($"Game starts in {TimeToNextTurn}ms");
            return result;
        }

        protected async Task<StatusResult> UpdateGameState()
        {
            var response = await _client.PostAsJsonAsync("api/status", new StatusRequest()
            {
                GameId = GameId
            });
            var result = await response.Content.ReadAsAsync<StatusResult>();
            if (!result.Success)
            {
                Console.WriteLine($"Error connecting to server: {result.Message}");
                throw new Exception("Connection lost");
            }
            TimeToNextTurn = (long)result.NextTurnStart.Subtract(DateTime.UtcNow).TotalMilliseconds;
            CurrentTurn = result.CurrentTurn;
            Console.WriteLine($"Next turn in {TimeToNextTurn}ms\n");
            return result;
        }

        protected async Task<List<MoveResult>> SendUpdate(List<MoveRequest> moveCommands)
        {
            var response = await _client.PostAsJsonAsync("api/move", moveCommands);
            var results = await response.Content.ReadAsAsync<List<MoveResult>>();
            foreach (var result in results)
            {
                if (!result.Success)
                    Console.WriteLine($"! {result.Message}");
            }
            return results;
        }

        public async Task Start()
        {
            await Logon();
            if (!_isRunning)
            {
                _isRunning = true;
                while (_isRunning)
                {
                    if (TimeToNextTurn > 0)
                    {
                        await Task.Delay((int)(TimeToNextTurn));
                    }

                    var gs = await UpdateGameState();
                    if (gs.IsGameOver)
                    {
                        _isRunning = false;
                        Console.WriteLine("Game Over!");
                        Console.WriteLine(gs.Status);
                        _client.Dispose();
                        break;
                    }

                    Update(gs);
                    var ur = await SendUpdate(this._pendingMoveRequests);
                    this._pendingMoveRequests.Clear();
                }
            }
        }

        public virtual void Update(StatusResult gs)
        {
            // override me
        }
    }
}
