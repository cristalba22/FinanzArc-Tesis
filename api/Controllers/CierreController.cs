using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using WebApi;

namespace WebApplication.Controllers
{
    [RoutePrefix("api/Cierre")]
    public class CierreController : ApiController
    {
        [HttpPost]
        [Route("FinalizarMes")]
        public IHttpActionResult FinalizarMes([FromBody] CierreRequest request)
        {
            if (request == null || request.IdUsuario <= 0)
                return BadRequest("Usuario no válido.");

            using (FinanzasDBEntities db = new FinanzasDBEntities())
            {
                using (var dbContextTransaction = db.Database.BeginTransaction())
                {
                    try
                    {
                        var ingresosVivos = db.Ingreso.Where(x => x.IdUsuario == request.IdUsuario).ToList();
                        var gastosVivos = db.Gasto.Where(x => x.IdUsuario == request.IdUsuario).ToList();

                        foreach (var i in ingresosVivos)
                        {
                            db.HistorialIngreso.Add(new HistorialIngreso
                            {
                                IdUsuario = i.IdUsuario,
                                IdTipoIngreso = i.IdTipoIngreso,
                                Monto = i.MontoIngreso,
                                IdDivisa = i.IdDivisa,
                                Fecha = i.FechaIngreso,
                                FechaDeGuardado = DateTime.Now,
                                Descripcion = i.Descripcion 
                            });
                        }

                        foreach (var g in gastosVivos)
                        {
                            db.HistorialGasto.Add(new HistorialGasto
                            {
                                IdUsuario = g.IdUsuario,
                                Idcategoria = g.IdCategoria, 
                                Monto = g.MontoGasto,        
                                IdDivisa = g.IdDivisa,
                                Fecha = g.FechaGasto,     
                                FechaDeGuardado = DateTime.Now,
                                Descripcion = g.Descripcion 
                            });
                        }

                        if (ingresosVivos.Any()) db.Ingreso.RemoveRange(ingresosVivos);
                        if (gastosVivos.Any()) db.Gasto.RemoveRange(gastosVivos);


                        db.SaveChanges();
                        dbContextTransaction.Commit();

                        return Ok(new { mensaje = "Éxito: Datos archivados y tablas limpias." });
                    }
                    catch (Exception ex)
                    {
                        dbContextTransaction.Rollback();

                        return Ok(new
                        {
                            mensaje = ex.Message,
                            inner = ex.InnerException?.Message,
                            inner2 = ex.InnerException?.InnerException?.Message,
                            stack = ex.StackTrace
                        });
                    }
                }
            }
        }
    }

    public class CierreRequest { public int IdUsuario { get; set; } }
}