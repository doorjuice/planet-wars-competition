using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CSharpAgent
{
    class Program
    {
        static void Main(string[] args)
        {
            // Arg parsing
            var endpointIndex = args.ToList().Select(a => a.ToLower()).ToList().IndexOf("-endpoint");
            var nameIndex = args.ToList().Select(a => a.ToLower()).ToList().IndexOf("-name");
            
            var endpoint = (endpointIndex > 0 && endpointIndex + 1 < args.Length) ? args[endpointIndex + 1] : "http://localhost:52802/";
            var name = (nameIndex > 0 && nameIndex + 1 < args.Length) ? args[nameIndex + 1] : "Anonymous";

            // Start Agent            
            var agent = new Agent(name, endpoint);
            agent.Start().Wait();            
        }
    }
}
