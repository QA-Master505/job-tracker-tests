Feature: Authentication
  As a user
  I want to be able to login and logout
  So that I can access my job applications

  Background:
    Given I am on the login page

  Scenario: Successful login with valid credentials
    When I enter email "testuser@test.com" and password "Test123!"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see my job applications

  Scenario: Failed login with invalid credentials
    When I enter email "wrong@test.com" and password "wrongpass"
    And I click the login button
    Then I should see an error message

  Scenario: Successful logout
    Given I am logged in
    When I click the logout button
    Then I should be redirected to the login page
