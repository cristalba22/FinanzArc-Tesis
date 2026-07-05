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
                        // 1. OBTENER TODO LO ACTUAL DEL USUARIO
                        var ingresosVivos = db.Ingreso.Where(x => x.IdUsuario == request.IdUsuario).ToList();
                        var gastosVivos = db.Gasto.Where(x => x.IdUsuario == request.IdUsuario).ToList();

                        // 2. PASAR INGRESOS A HISTORIAL_INGRESO
                        foreach (var i in ingresosVivos)
                        {
                            db.HistorialIngreso.Add(new HistorialIngreso
                            {
                                IdUsuario = i.IdUsuario,
                                IdTipoIngreso = i.IdTipoIngreso,
                                Monto = i.MontoIngreso, // De 'MontoIngreso' a 'Monto'
                                IdDivisa = i.IdDivisa,
                                Fecha = i.FechaIngreso, // De 'FechaIngreso' a 'Fecha'
                                FechaDeGuardado = DateTime.Now,
                                Descripcion = i.Descripcion // Agregado para mantener la descripción en el historial
                            });
                        }

                        // 3. PASAR GASTOS A HISTORIAL_GASTO
                        foreach (var g in gastosVivos)
                        {
                            db.HistorialGasto.Add(new HistorialGasto
                            {
                                IdUsuario = g.IdUsuario,
                                Idcategoria = g.IdCategoria, // Ojo: verifica 'Idcategoria' vs 'IdCategoria'
                                Monto = g.MontoGasto,        // De 'MontoGasto' a 'Monto'
                                IdDivisa = g.IdDivisa,
                                Fecha = g.FechaGasto,        // De 'FechaGasto' a 'Fecha'
                                FechaDeGuardado = DateTime.Now,
                                Descripcion = g.Descripcion // Agregado para mantener la descripción en el historial
                            });
                        }

                        // 4. ELIMINAR DE TABLAS VIVAS (EMPEZAR DE 0)
                        if (ingresosVivos.Any()) db.Ingreso.RemoveRange(ingresosVivos);
                        if (gastosVivos.Any()) db.Gasto.RemoveRange(gastosVivos);

                        // 5. GUARDAR Y CONFIRMAR
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