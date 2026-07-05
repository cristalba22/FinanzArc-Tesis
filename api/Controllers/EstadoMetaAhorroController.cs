using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using WebApi;

namespace WebApplication.Controllers
{
    public class EstadoMetaAhorroController : ApiController
    {
        // GET: api/Cliente
        public List<EstadoMetaAhorro> Get()
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                return db.EstadoMetaAhorro.ToList();
            }
        }

        // GET: api/Cliente/5
        public EstadoMetaAhorro Get(int id)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                return db.EstadoMetaAhorro.Find(id);
            }
        }

        // POST: api/Cliente
        public void Post([FromBody] EstadoMetaAhorro value)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                db.EstadoMetaAhorro.Add(value);
                db.SaveChanges();
            }
        }

        // PUT: api/Cliente/5
        public void Put(int id, [FromBody] EstadoMetaAhorro value)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                var obj = db.EstadoMetaAhorro.Find(id);
                if (obj != null)
                {
                    obj.IdEstadoMetaAhorro = value.IdEstadoMetaAhorro;
                    obj.Nombre = value.Nombre;
                    obj.Activo = value.Activo;

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
                var obj = db.EstadoMetaAhorro.Find(id);
                if (obj != null)
                {
                    db.EstadoMetaAhorro.Remove(obj);
                    db.SaveChanges();
                }
            }
        }
    }
}
