import endpoints from '../env/endpoints.json';
import credentials from '../fixtures/login.json';
import { faker } from '@faker-js/faker';

// Cypress.on('fail', (error, runnable) => {
//     console.error(error);
//     return false;
// });

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

    it('show products', () => {
        cy.request({
            method: 'GET',
            url: endpoints.baseUrl + endpoints.produtos,
            headers: {
                Authorization: `${authToken}`
            },
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('produtos');
            expect(response.body).to.have.property('quantidade');
            console.log(response.body.produtos);
        });
    });

    it('add and delete a new product', () => {
        cy.request({
            method: 'POST',
            url: endpoints.baseUrl + endpoints.produtos,
            headers: {
                Authorization: `${authToken}`
            },
            body: {
                nome: faker.commerce.productName(),
                preco: '5.00',
                descricao: 'banana da terra',
                quantidade: '10',
            },
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body).to.have.property('message', 'Cadastro realizado com sucesso');
        });
    });
    

    it('add a user with admin false, try to add a new product, and delete user', () => {
        const userCredentials = {
            nome: faker.person.fullName(),
            email: `test_${faker.string.alphanumeric(8)}@${faker.internet.domainName()}`,
            password: "teste@123",
            administrador: "false"
        };
    
        // Primeiro, criar o usuário não-admin
        cy.request({
            method: 'POST',
            url: endpoints.baseUrl + endpoints.usuarios,
            headers: {
                Authorization: `${authToken}`
            },
            body: userCredentials,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body).to.have.property('message', 'Cadastro realizado com sucesso');
            
            const userId = response.body._id;
    
            // Fazer login com o usuário não-admin para obter seu token
            cy.request({
                method: 'POST',
                url: endpoints.baseUrl + endpoints.login,
                body: {
                    email: userCredentials.email,
                    password: userCredentials.password
                }
            }).then((loginResponse) => {
                const nonAdminToken = loginResponse.body.authorization;
    
                // Tentar adicionar produto com o token do usuário não-admin
                cy.request({
                    method: 'POST',
                    url: endpoints.baseUrl + endpoints.produtos,
                    headers: {
                        Authorization: `${nonAdminToken}`
                    },
                    body: {
                        nome: faker.commerce.productName(),
                        preco: faker.commerce.price(),
                        descricao: faker.commerce.productDescription(),
                        quantidade: faker.number.int(),
                    },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(403);
                    expect(response.body).to.have.property('message', 'Rota exclusiva para administradores');
                });
    
                // Deletando o usuário criado (usando o token admin original)
                cy.request({
                    method: 'DELETE',
                    url: `${endpoints.baseUrl + endpoints.usuarios}/${userId}`,
                    headers: {
                        Authorization: `${authToken}`
                    },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body).to.have.property('message', 'Registro excluído com sucesso');
                });
            });
        });
    });
    it('add an existing product', () => {
        cy.request({
            method: 'POST',
            url: endpoints.baseUrl + endpoints.produtos,
            headers: {
                Authorization: `${authToken}`
            },
            body: {
                nome: 'banana da terra',
                preco: '5.00',
                descricao: 'banana da terra',
                quantidade: '10',
            },
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body).to.have.property('message', 'Já existe produto com esse nome');
        });
    });
    it('create, edit and delete a product', () => {
        cy.request({
            method: 'POST',
            url: endpoints.baseUrl + endpoints.produtos,
            headers: {
                Authorization: `${authToken}`
            },
            body: {
                nome: faker.commerce.productName(),
                preco: '5.00',
                descricao: 'banana da terra',
                quantidade: '10',
            },
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body).to.have.property('message', 'Cadastro realizado com sucesso');
            const productId = response.body._id;
            cy.request({
                method: 'PUT',
                url: `${endpoints.baseUrl + endpoints.produtos}/${productId}`,
                headers: {
                    Authorization: `${authToken}`
                },
                body: {
                    nome: faker.commerce.productName(),
                    preco: '5.00',
                    descricao: 'banana da terra',
                    quantidade: '10',
                },
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property('message', 'Registro alterado com sucesso');
                cy.request({
                    method: 'DELETE',
                    url: `${endpoints.baseUrl + endpoints.produtos}/${productId}`,
                    headers: {
                        Authorization: `${authToken}`
                    },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body).to.have.property('message', 'Registro excluído com sucesso');
                });
            });
        });
    });
});
