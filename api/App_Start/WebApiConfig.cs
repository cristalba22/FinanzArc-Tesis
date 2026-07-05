using System.Web.Http;
using System.Configuration;

namespace WebApi.App_Start
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {

            // 2. Aplicamos la configuración de CORS dinámica
            var cors = new System.Web.Http.Cors.EnableCorsAttribute("*", "*", "*");

            config.EnableCors(cors);

            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );
        }
    }
}