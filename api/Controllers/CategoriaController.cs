using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using WebApi;

namespace WebApplication.Controllers
{
    public class CategoriaController : ApiController
    {
        // GET: api/Cliente
        public List<Categoria> Get()
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                return db.Categoria.ToList();
            }
        }

        // GET: api/Cliente/5
        public Categoria Get(int id)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                return db.Categoria.Find(id);
            }
        }

        // POST: api/Cliente
        public void Post([FromBody] Categoria value)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                db.Categoria.Add(value);
                db.SaveChanges();
            }
        }

        // PUT: api/Cliente/5
        public void Put(int id, [FromBody] Categoria value)
        {
            using (FinanzasDBEntities db = new FinanzasDBEntities())

            {
                var obj = db.Categoria.Find(id);
                if (obj != null)
                {
                    obj.IdCategoria = value.IdCategoria;
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
                var obj = db.Categoria.Find(id);
                if (obj != null)
                {
                    db.Categoria.Remove(obj);
                    db.SaveChanges();
                }
            }
        }
    }
}
