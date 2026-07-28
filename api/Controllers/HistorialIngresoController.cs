using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using System.Data.Entity;
using WebApi; // Asegúrate de que este namespace coincida con tu proyecto

namespace WebApplication.Controllers
{
    [RoutePrefix("api/HistorialIngreso")]
    public class HistorialIngresoController : ApiController
    {
        private FinanzasDBEntities db = new FinanzasDBEntities();

        // GET: api/HistorialIngreso/ByUsuario/20
        [HttpGet]
        [Route("ByUsuario/{idUsuario}")]
        public IHttpActionResult GetByUsuario(int idUsuario)
        {
            try
            {
                var historial = db.HistorialIngreso
                                  .Where(x => x.IdUsuario == idUsuario)
                                  .ToList();
                return Ok(historial);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/HistorialIngreso (Opcional)
        [HttpGet]
        public IHttpActionResult Get()
        {
            return Ok(db.HistorialIngreso.ToList());
        }

        // GET: api/HistorialIngreso/ByUsuario/BetweenDates?idUsuario=1&start=2026-01-01&end=2026-01-31
        [HttpGet]
        [Route("ByUsuario/BetweenDates")]
        public IHttpActionResult GetByUsuarioBetweenDates(int idUsuario, DateTime start, DateTime end)
        {
            try
            {
                if (start > end)
                    return BadRequest("La fecha inicial debe ser anterior o igual a la fecha final.");

                var historial = db.HistorialIngreso
                                  .Where(x => x.IdUsuario == idUsuario
                                              && DbFunctions.TruncateTime(x.Fecha) >= DbFunctions.TruncateTime(start)
                                              && DbFunctions.TruncateTime(x.FechaDeGuardado) <= DbFunctions.TruncateTime(end))
                                  .ToList();

                return Ok(historial);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        // POST: api/HistorialGasto/Archivar/5
        
        [HttpPost]
        [Route("Archivar/{id}")]
        public IHttpActionResult Archivar(int id)
        {
            using (var dbContextTransaction = db.Database.BeginTransaction())
            {
                try
                {
                    var ingresoOriginal = db.Ingreso.Find(id);
                    
                    if (ingresoOriginal == null) 
                        return NotFound();

                    var nuevoHistorial = new HistorialGasto
                    {
                        IdUsuario = ingresoOriginal.IdUsuario,
                        IdTipoIngreso = ingresoOriginal.IdTipoIngreso, 
                        IdDivisa = ingresoOriginal.IdDivisa,
                        MontoIngreso = ingresoOriginal.MontoIngreso,        
                        FechaIngreso = ingresoOriginal.FechaIngreso,        
                        FechaDeGuardado = DateTime.Now,
                        Descripcion = ingresoOriginal.Descripcion 
                    };

                    db.HistorialIngreso.Add(nuevoHistorial);
                    db.Ingreso.Remove(ingresoOriginal);

                    db.SaveChanges();
                    dbContextTransaction.Commit();

                    return Ok(new { mensaje = "Ingreso archivado y eliminado exitosamente." });
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    return InternalServerError(ex);
                }
            }
        }


        // DELETE: api/HistorialIngreso/5
        [HttpDelete]
        public IHttpActionResult Delete(int id)
        {
            var obj = db.HistorialIngreso.Find(id);
            if (obj == null) return NotFound();

            db.HistorialIngreso.Remove(obj);
            db.SaveChanges();
            return Ok("Registro eliminado");
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}