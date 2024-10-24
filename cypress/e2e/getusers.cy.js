import endpoints from '../env/endpoints.json';
import credentials from '../fixtures/login.json';
import { faker } from '@faker-js/faker';


describe('Users', () => {
    let authToken = '';

    beforeEach(() => {
        cy.request({
            method: 'POST',
            url: endpoints.baseUrl + endpoints.login,
            body: {
                email: credentials.email,
                password: credentials.password
            }
        }).then((response) => {
            Cypress.env('authToken', response.body.authorization);
            authToken = response.body.authorization;
        });
    });

    it('get users with valid token', () => {
        cy.request({
            method: 'GET',
            url: endpoints.baseUrl + endpoints.usuarios,
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('usuarios');
            expect(response.body).to.have.property('quantidade');
            console.log(response.body.usuarios);
        });
    });

    it('add and delete a new user', () => {
        cy.request({
            method: 'POST',
            url: endpoints.baseUrl + endpoints.usuarios,
            headers: {
                Authorization: `Bearer ${authToken}`
            },
            body: {
                nome: faker.person.fullName(),
                email: faker.internet.email(),
                password: "123456",
                administrador: "true"
            }
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body).to.have.property('message', 'Cadastro realizado com sucesso');

            const userId = response.body._id;

            cy.request({
                method: 'DELETE',
                url: `${endpoints.baseUrl + endpoints.usuarios}/${userId}`,
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property('message', 'Registro excluído com sucesso');
            });
        });
    });

    it('find user by id', () => {
        cy.request({
            method: 'GET',
            url: endpoints.baseUrl + endpoints.usuarios + '/HmWJhqBbMqCa0cqU',
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('nome', 'teste-bareaa');
        });
    });

    it('edit user by id', () => {
        cy.request({
            method: 'PUT',
            url: endpoints.baseUrl + endpoints.usuarios + '/HmWJhqBbMqCa0cqU',
            headers: {
                Authorization: `Bearer ${authToken}`
            },
            body: {
                nome: 'teste-bareaa',
                email: 'email@teste.com.br',  
                password: faker.internet.password(),
                administrador: 'true'
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('message', 'Registro alterado com sucesso');
        });
    });

    it('add a new user with no existing user for edit', () => {
        cy.request({
            method: 'PUT',
            url: endpoints.baseUrl + endpoints.usuarios + '/Haf2fasfa', 
            headers: {
                Authorization: `Bearer ${authToken}`
            },
            body: {
                nome: faker.person.fullName(),
                email: faker.internet.email(),
                password: "123456",
                administrador: "true"
            }
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body).to.have.property('message', 'Cadastro realizado com sucesso');
        });
    });
    it('edit user by invalid email', () => {
        cy.request({
            method: 'PUT',
            url: endpoints.baseUrl + endpoints.usuarios + '/HmWJhqBbMqCa0cqU',
            headers: {
                Authorization: `Bearer ${authToken}`
            },
            body: {
                nome: 'teste-bareaa',
                email: 'fulano@qa.com',
                password: faker.internet.password(),
                administrador: 'true'
            },
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body).to.have.property('message', 'Este email já está sendo usado');
        });
    });
    
});
