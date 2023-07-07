const MONCOMPTEPRO_HOST =
  Cypress.env('MONCOMPTEPRO_HOST') || 'http://localhost:3000';

describe('join organizations', () => {
  before(() => {
    cy.mailslurp().then(mailslurp =>
      mailslurp.inboxController.deleteAllInboxEmails({
        inboxId: 'c6c64542-5601-43e0-b320-b20da72f6edc',
      })
    );
    cy.mailslurp().then(mailslurp =>
      mailslurp.inboxController.deleteAllInboxEmails({
        inboxId: '34c5063f-81c0-4d09-9d0b-a7502f844cdf',
      })
    );
  });
  beforeEach(() => {
    cy.login(
      'c6c64542-5601-43e0-b320-b20da72f6edc@mailslurp.com',
      'password123'
    );
  });

  it('join suggested organisation', function() {
    // Visit the signup page
    cy.visit(`${MONCOMPTEPRO_HOST}/`);

    // The user get this suggestion because it as mailslurp.com as verified domain
    cy.get('.fr-grid-row .fr-col-12:first-child .fr-tile__link').contains(
      'Commune de clamart - Mairie'
    );

    // The user get this suggestion because it as 5 members with mailslurp.com as email domain
    cy.get('.fr-grid-row .fr-col-12:last-child .fr-tile__link').contains(
      'Commune de clamart - Service assainissement'
    );

    // Click on the suggested organization
    cy.get('.fr-grid-row .fr-col-12:first-child .fr-tile__link').click();

    // Click on "continue" on the welcome page
    cy.get('[type="submit"]').click();

    // Check redirection to home page
    cy.contains('Votre compte est créé');

    cy.mailslurp()
      // use inbox id and a timeout of 30 seconds
      .then(mailslurp =>
        mailslurp.waitForLatestEmail(
          '34c5063f-81c0-4d09-9d0b-a7502f844cdf',
          60000,
          true
        )
      )
      // assert reception of confirmation email
      .then(email => {
        expect(email.subject).to.equal('Votre organisation sur MonComptePro');
      });

    cy.mailslurp()
      // use inbox id and a timeout of 30 seconds
      .then(mailslurp =>
        mailslurp.waitForLatestEmail(
          '34c5063f-81c0-4d09-9d0b-a7502f844cdf',
          60000,
          true
        )
      )
      // assert reception of notification email
      .then(email => {
        expect(email.body).to.match(
          /.*Jean Nouveau.*\(c6c64542-5601-43e0-b320-b20da72f6edc@mailslurp.com\) a rejoint votre organisation.*Commune de clamart - Mairie.*sur .*MonComptePro/
        );
      });
  });

  it('join another organisation', function() {
    // Visit the join organization page
    cy.visit(`${MONCOMPTEPRO_HOST}/users/join-organization`);
    cy.get('[name="siret"]').type('13002526500013');
    cy.get('[type="submit"]').click();

    // Check redirection to moderation block page
    cy.contains(
      'Notre équipe est en train de vous rattacher à cette organisation.'
    );
  });
});
