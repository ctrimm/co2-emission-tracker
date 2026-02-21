/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "website-weight",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: "6.56.0"
      }
    };
  },
  async run() {
    console.log('Running...');

    // Create secrets
    const supabaseUrl = new sst.Secret("MySupabaseUrl", process.env.PUBLIC_SUPABASE_URL);
    const supabaseAnonKey = new sst.Secret("MySupabaseAnonRoleKey", process.env.PUBLIC_SUPABASE_ANON_KEY);

    // Create the API Gateway with linked secrets.
    // CORS is restricted to the production frontend and localhost for development.
    // Without this, SST defaults to wildcard (*) which allows any site to call the API.
    const api = new sst.aws.ApiGatewayV2("EmissionsApi", {
      cors: {
        allowOrigins: [
          "https://co2.ignitebright.com",
          "http://localhost:4321",
        ],
        allowMethods: ["GET"],
        allowHeaders: ["Content-Type"],
      },
      link: [supabaseUrl, supabaseAnonKey]
    });

    // Define routes for emissions data
    api.route("GET /emissions-unique", "packages/functions/src/emissions-unique.handler");
    api.route("GET /emissions/{domain}", "packages/functions/src/domainEmissions.handler");
    api.route("GET /sites", "packages/functions/src/sites.handler");
    api.route("GET /stats", "packages/functions/src/stats.handler");
    api.route("GET /trend", "packages/functions/src/trend.handler");
    api.route("GET /leaderboard", "packages/functions/src/leaderboard.handler");
  }
});
