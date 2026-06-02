const request = require('supertest');
const app = require('../index'); // Importa tu aplicación Express

describe('App Endpoints Básicos', () => {
  it('Debería retornar status 200 en la ruta raíz (GET /)', async () => {
    const res = await request(app).get('/');
    if (res.statusCode !== 200) console.log(res.text);
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('¡Backend funcionando!');
  });

  it('Debería retornar status 404 para una ruta que no existe', async () => {
    const res = await request(app).get('/ruta-que-no-existe');
    expect(res.statusCode).toEqual(404);
  });
});
