import { faker } from '@faker-js/faker';
import endpoints from '../env/endpoints.json';

describe('Shopping Cart', () => {
    let authToken = '';
    let productId = '';
    const baseUrl = endpoints.baseUrl;

    beforeEach(() => {
        // Login para obter o token
        cy.request({
            method: 'POST',
            url: `${baseUrl}/login`,
            body: {
                email: 'fulano@qa.com',
                password: 'teste'
            }
        }).then((response) => {
            authToken = response.body.authorization;

            // Criar um produto para usar nos testes
            const product = {
                nome: faker.commerce.productName(),
                preco: parseInt(faker.commerce.price()),
                descricao: faker.commerce.productDescription(),
                quantidade: 10,
            };

            cy.request({
                method: 'POST',
                url: `${baseUrl}/produtos`,
                headers: {
                    Authorization: `${authToken}`
                },
                body: product
            }).then((response) => {
                expect(response.status).to.eq(201);
                productId = response.body._id;
            });
        });
    });

    it('should list all shopping carts', () => {
        cy.request({
            method: 'GET',
            url: `${baseUrl}/carrinhos`,
            headers: {
                Authorization: `${authToken}`
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('carrinhos');
            expect(response.body).to.have.property('quantidade');
        });
    });

    it('should create a new cart and then cancel it', () => {
        const cart = {
            produtos: [
                {
                    idProduto: productId,
                    quantidade: 2
                }
            ]
        };
    
        cy.log('Creating cart with:', cart);
        
        cy.request({
            method: 'POST',
            url: `${baseUrl}/carrinhos`,
            headers: {
                Authorization: `${authToken}`
            },
            body: cart,
            failOnStatusCode: false
        }).then((response) => {
            cy.log('Cart creation response:', response);
            expect(response.status).to.eq(201);
            expect(response.body).to.have.property('message', 'Cadastro realizado com sucesso');
            expect(response.body).to.have.property('_id');
    
            const cartId = response.body._id;
    
            cy.request({
                method: 'GET',
                url: `${baseUrl}/carrinhos/${cartId}`,
                headers: {
                    Authorization: `${authToken}`
                }
            }).then((getResponse) => {
                expect(getResponse.status).to.eq(200);
                expect(getResponse.body.quantidadeTotal).to.eq(2);
            });
    
            cy.request({
                method: 'DELETE',
                url: `${baseUrl}/carrinhos/cancelar-compra`,
                headers: {
                    Authorization: `${authToken}`
                }
            }).then((deleteResponse) => {
                expect(deleteResponse.status).to.eq(200);
                expect(response.body).to.have.property('message', 'Cadastro realizado com sucesso');
            });
        });
    });
    

    it('should not allow creating more than one cart per user', () => {
        const cart = {
            produtos: [
                {
                    idProduto: productId,
                    quantidade: 1
                }
            ]
        };

        cy.request({
            method: 'POST',
            url: `${baseUrl}/carrinhos`,
            headers: {
                Authorization: `${authToken}`
            },
            body: cart,
            failOnStatusCode: false
        }).then(() => {
            cy.request({
                method: 'POST',
                url: `${baseUrl}/carrinhos`,
                headers: {
                    Authorization: `${authToken}`
            },
                body: cart,
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.body).to.have.property('message', 'Não é permitido ter mais de 1 carrinho');
            });

            // Limpar carrinho criado
            cy.request({
                method: 'DELETE',
                url: `${baseUrl}/carrinhos/cancelar-compra`,
                headers: {
                    Authorization: `${authToken}`
                }
            });
        });
    });

    it('should complete purchase successfully', () => {
        const cart = {
            produtos: [
                {
                    idProduto: productId,
                    quantidade: 1
                }
            ]
        };

        // Criar carrinho
        cy.request({
            method: 'POST',
            url: `${baseUrl}/carrinhos`,
            headers: {
                Authorization: `${authToken}`
            },
            body: cart,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(201);

            // Concluir a compra
            cy.request({
                method: 'DELETE',
                url: `${baseUrl}/carrinhos/concluir-compra`,
                headers: {
                    Authorization: `${authToken}`
                }
            }).then((deleteResponse) => {
                expect(deleteResponse.status).to.eq(200);
                expect(deleteResponse.body).to.have.property('message', 'Registro excluído com sucesso');
            });
        });
    });

    it('should not create cart with invalid product', () => {
        const cart = {
            produtos: [
                {
                    idProduto: 'invalid_id',
                    quantidade: 1
                }
            ]
        };

        cy.request({
            method: 'POST',
            url: `${baseUrl}/carrinhos`,
            headers: {
                Authorization: `${authToken}`
            },
            body: cart,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body).to.have.property('message', 'Produto não encontrado');
        });
    });

    afterEach(() => {
        // Limpar o produto criado
        if (productId) {
            cy.request({
                method: 'DELETE',
                url: `${baseUrl}/produtos/${productId}`,
                headers: {
                    Authorization: `${authToken}`
                },
                failOnStatusCode: false
            });
        }
    });
});