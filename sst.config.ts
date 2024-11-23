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

    // Create the API Gateway with linked secrets
    const api = new sst.aws.ApiGatewayV2("EmissionsApi", {
      link: [supabaseUrl, supabaseAnonKey]
    });

    // Define routes for emissions data
    api.route("GET /emissions", "packages/functions/src/emissions.handler");
    api.route("GET /emissions/{domain}", "packages/functions/src/domainEmissions.handler");
    api.route("GET /sites", "packages/functions/src/sites.handler");
  }
});
