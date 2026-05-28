Feature: User Profile Management
  As a logged in user
  I want to manage my profile
  So that I can keep my information updated

  Background:
    Given I am logged in

  Scenario: Update username
    When I navigate to profile settings
    And I update my username to "newusername"
    Then my username should be updated successfully

  Scenario: Update email
    When I navigate to profile settings
    And I update my email to "newemail@test.com"
    Then my email should be updated successfully
