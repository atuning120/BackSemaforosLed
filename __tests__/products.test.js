const request = require('supertest');
const app = require('../index');

describe('Rutas de Productos (/api/productos)', () => {
  it('Debería retornar status 200 y la lista de productos hogar/electrónico', async () => {
    const res = await request(app).get('/api/productos/hogar/electronico');
    
    // Verificamos que responda correctamente
    expect(res.statusCode).toEqual(200);
    
    // Verificamos que la respuesta esté definida (asumiendo que devuelve un JSON)
    expect(res.body).toBeDefined();
  });
});
