using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using WebApi;

namespace WebApplication.Controllers
{
    public class DivisaController : ApiController
    {
        // GET: api/Cliente
        public List<Divisa> Get()
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                return db.Divisa.ToList();
            }
        }

        // GET: api/Cliente/5
        public Divisa Get(int id)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                return db.Divisa.Find(id);
            }
        }

        // POST: api/Cliente
        public void Post([FromBody] Divisa value)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                db.Divisa.Add(value);
                db.SaveChanges();
            }
        }

        // PUT: api/Cliente/5
        public void Put(int id, [FromBody] Divisa value)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                var obj = db.Divisa.Find(id);
                if (obj != null)
                {
                    obj.IdDivisa = value.IdDivisa;
                    obj.Nombre = value.Nombre;
                    obj.CodigoISO = value.CodigoISO;

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
                var obj = db.Divisa.Find(id);
                if (obj != null)
                {
                    db.Divisa.Remove(obj);
                    db.SaveChanges();
                }
            }
        }
    }
}
