using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using WebApi;

namespace WebApplication.Controllers
{
    public class ModoPagoController : ApiController
    {
        // GET: api/Cliente
        public List<ModoPago> Get()
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                return db.ModoPago.ToList();
            }
        }

        // GET: api/Cliente/5
        public ModoPago Get(int id)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                return db.ModoPago.Find(id);
            }
        }

        // POST: api/Cliente
        public void Post([FromBody] ModoPago value)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                db.ModoPago.Add(value);
                db.SaveChanges();
            }
        }

        // PUT: api/Cliente/5
        public void Put(int id, [FromBody] ModoPago value)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                var obj = db.ModoPago.Find(id);
                if (obj != null)
                {
                    obj.IdModoPago = value.IdModoPago;
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
                var obj = db.ModoPago.Find(id);
                if (obj != null)
                {
                    db.ModoPago.Remove(obj);
                    db.SaveChanges();
                }
            }
        }
    }
}
