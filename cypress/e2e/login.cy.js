import login from '../fixtures/login.json';
import endpoints from '../env/endpoints.json';

describe('Login', () => {

    it('login with valid credentials', () => {
        cy.request({
            method: 'POST',
            url: endpoints.baseUrl + endpoints.login,
            body: {
                email: login.email,
                password: login.password
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('authorization');
            Cypress.env('authToken', response.body.authorization);
        });
    });

    it('login with invalid password', () => {
        cy.request({
            method: 'POST',
            url: endpoints.baseUrl + endpoints.login,
            failOnStatusCode: false,
            body: {
                email: login.email,
                password: 'invalid'
            }
        }).then((response) => {
            expect(response.status).to.eq(401);
            expect(response.body).to.have.property("message", "Email e/ou senha inválidos");
        });
    });

    it('login with invalid email', () => {
        cy.request({
            method: 'POST',
            url: endpoints.baseUrl + endpoints.login,
            failOnStatusCode: false, 
            body: {
                email: 'invalido@teste.com',
                password: login.password
            }
        }).then((response) => {
            expect(response.status).to.eq(401);
            expect(response.body).to.have.property("message", "Email e/ou senha inválidos");
        });
    });
});
