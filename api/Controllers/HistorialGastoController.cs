using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web.Http;
using WebApi; // Asegúrate de que este namespace coincida con tu proyecto

namespace WebApplication.Controllers
{
    [RoutePrefix("api/HistorialGasto")]
    public class HistorialGastoController : ApiController
    {
        private FinanzasDBEntities db = new FinanzasDBEntities();

        // GET: api/HistorialGasto/ByUsuario/20
        [HttpGet]
        [Route("ByUsuario/{idUsuario}")]
        public IHttpActionResult GetByUsuario(int idUsuario)
        {
            try
            {
                var historial = db.HistorialGasto
                                  .Where(x => x.IdUsuario == idUsuario)
                                  .ToList();
                return Ok(historial);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/HistorialGasto (Opcional: Ver todo el historial de la BD)
        [HttpGet]
        public IHttpActionResult Get()
        {
            return Ok(db.HistorialGasto.ToList());
        }

        [HttpGet]
        [Route("ByUsuario/BetweenDates")]
        public IHttpActionResult GetByUsuarioBetweenDates(int idUsuario, DateTime start, DateTime end)
        {
            try
            {
                if (start > end)
                    return BadRequest("La fecha inicial debe ser anterior o igual a la fecha final.");

                var historial = db.HistorialGasto
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

        // ---------------------------------------------------------
        // NUEVO ENDPOINT: ARCHIVAR UN GASTO INDIVIDUAL
        // POST: api/HistorialGasto/Archivar/5
        // ---------------------------------------------------------
        [HttpPost]
        [Route("Archivar/{id}")]
        public IHttpActionResult Archivar(int id)
        {
            // Iniciamos una transacción para garantizar que no se pierdan datos si algo falla
            using (var dbContextTransaction = db.Database.BeginTransaction())
            {
                try
                {
                    // 1. Buscar el gasto vivo en la base de datos
                    var gastoOriginal = db.Gasto.Find(id);
                    
                    if (gastoOriginal == null) 
                        return NotFound();

                    // 2. Mapear los datos a la entidad histórica
                    var nuevoHistorial = new HistorialGasto
                    {
                        IdUsuario = gastoOriginal.IdUsuario,
                        Idcategoria = gastoOriginal.IdCategoria, 
                        Monto = gastoOriginal.MontoGasto,        
                        IdDivisa = gastoOriginal.IdDivisa,
                        Fecha = gastoOriginal.FechaGasto,        
                        FechaDeGuardado = DateTime.Now,
                        Descripcion = gastoOriginal.Descripcion 
                    };

                    // 3. Guardar en el historial y eliminar el original en la misma operación
                    db.HistorialGasto.Add(nuevoHistorial);
                    db.Gasto.Remove(gastoOriginal);

                    // 4. Confirmar cambios
                    db.SaveChanges();
                    dbContextTransaction.Commit();

                    return Ok(new { mensaje = "Gasto archivado y eliminado exitosamente." });
                }
                catch (Exception ex)
                {
                    // Si algo falla, revertimos los cambios (el gasto original se mantiene a salvo)
                    dbContextTransaction.Rollback();
                    return InternalServerError(ex);
                }
            }
        }

        // DELETE: api/HistorialGasto/5
        [HttpDelete]
        public IHttpActionResult Delete(int id)
        {
            var obj = db.HistorialGasto.Find(id);
            if (obj == null) return NotFound();

            db.HistorialGasto.Remove(obj);
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