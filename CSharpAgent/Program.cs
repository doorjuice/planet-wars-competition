using System;
using System.Collections.Generic;
using System.Linq;

namespace CSharpAgent
{
    class Program
    {
        static void Main(string[] args)
        {
            // Arg parsing
            var endpointIndex = args.ToList().Select(a => a.ToLower()).ToList().IndexOf("-endpoint") + 1;
            var nameIndex = args.ToList().Select(a => a.ToLower()).ToList().IndexOf("-name") + 1;
            
            var endpoint = (endpointIndex > 0 && endpointIndex < args.Length) ? args[endpointIndex] : "http://localhost:52802/";
            var name = (nameIndex > 0 && nameIndex < args.Length) ? args[nameIndex] : "Anonymous";

            // Start Agent
            var agent = new Agent(name, endpoint);
            agent.Start().Wait();
        }
    }
}
