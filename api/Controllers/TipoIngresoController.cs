using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using WebApi;

namespace WebApplication.Controllers
{
    public class TipoIngresoController : ApiController
    {
        // GET: api/Cliente
        public List<TipoIngreso> Get()
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                return db.TipoIngreso.ToList();
            }
        }

        // GET: api/Cliente/5
        public TipoIngreso Get(int id)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                return db.TipoIngreso.Find(id);
            }
        }

        // POST: api/Cliente
        public void Post([FromBody] TipoIngreso value)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                db.TipoIngreso.Add(value);
                db.SaveChanges();
            }
        }

        // PUT: api/Cliente/5
        public void Put(int id, [FromBody] TipoIngreso value)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                var obj = db.TipoIngreso.Find(id);
                if (obj != null)
                {
                    obj.IdTipoIngreso = value.IdTipoIngreso;
                    obj.Nombre = value.Nombre;

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
                var obj = db.TipoIngreso.Find(id);
                if (obj != null)
                {
                    db.TipoIngreso.Remove(obj);
                    db.SaveChanges();
                }
            }
        }
    }
}
