using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using WebApi;

namespace WebApplication.Controllers
{
    public class AhorroHistorialController : ApiController
    {
        // GET: api/Cliente
        public List<AhorroHistorial> Get()
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                return db.AhorroHistorial.ToList();
            }
        }

        // GET: api/Cliente/5
        public AhorroHistorial Get(int id)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                return db.AhorroHistorial.Find(id);
            }
        }

        // POST: api/Cliente
        public void Post([FromBody] AhorroHistorial value)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                db.AhorroHistorial.Add(value);
                db.SaveChanges();
            }
        }

        // PUT: api/Cliente/5
        public void Put(int id, [FromBody] AhorroHistorial value)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                var obj = db.AhorroHistorial.Find(id);
                if (obj != null)
                {
                    obj.IdAhorroHistorial = value.IdAhorroHistorial;
                    obj.IdMetaAhorro = value.IdMetaAhorro;
                    obj.IdCuentaOrigen = value.IdCuentaOrigen;
                    obj.MontoAportado = value.MontoAportado;
                    obj.FechaAporte = value.FechaAporte;
                    obj.Nota = value.Nota;
                    obj.FechaCreacion = value.FechaCreacion;

                    db.Entry(obj).State = System.Data.Entity.EntityState.Modified;
                    db.SaveChanges();
                }
            }
        }

        // DELETE: api/Cliente/5
        public void Delete(int id)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                var obj = db.AhorroHistorial.Find(id);
                if (obj != null)
                {
                    db.AhorroHistorial.Remove(obj);
                    db.SaveChanges();
                }
            }
        }
    }
}
