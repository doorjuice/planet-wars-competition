using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PlanetWars.Shared;

namespace CSharpAgent
{
    public class Agent : AgentBase
    {
        public Agent(string name, string endpoint) : base(name, endpoint){}

        public override void Update(StatusResult gamestate)
        {
            // do cool ai stuff
            Console.WriteLine($"[{DateTime.Now.ToShortTimeString()}]Current Turn: {gamestate.CurrentTurn}");
            Console.WriteLine($"My ID: {MyId}");
            Console.WriteLine($"Owned Planets: {string.Join(", ", gamestate.Planets.Where(p => p.OwnerId == MyId).Select(p =>  p.Id))}");

            // find the first planet we don't own
            var targetPlanet = gamestate.Planets.FirstOrDefault(p => p.OwnerId != MyId);
            if (targetPlanet == null) return; // WE OWN IT ALLLLLLLLL

            Console.WriteLine($"Target Planet: {targetPlanet.Id}:{targetPlanet.NumberOfShips}");                       

            // send half rounded down of our ships from each planet we do own
            foreach (var planet in gamestate.Planets.Where(p => p.OwnerId == MyId))
            {
                var ships = (int)Math.Floor(planet.NumberOfShips / 2.0);
                if (ships > 0)
                {
                    SendFleet(planet.Id, targetPlanet.Id, ships);
                }
            }
        }
    }
}
