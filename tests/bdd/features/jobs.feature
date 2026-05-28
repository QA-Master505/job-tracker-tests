Feature: Job Applications Management
  As a logged in user
  I want to manage my job applications
  So that I can track my job search

  Background:
    Given I am logged in

  Scenario: Create a new job application
    When I click add new job button
    And I fill in company name "Google"
    And I fill in position "QA Engineer"
    And I select status "Applied"
    And I submit the form
    Then I should see "Google" in my job list

  Scenario: View job application details
    Given I have at least one job application
    When I click on a job application
    Then I should see the job details

  Scenario: Update job application status
    Given I have at least one job application
    When I update the status to "Interview"
    Then the status should show "Interview"

  Scenario: Delete a job application
    Given I have at least one job application
    When I delete the job application
    Then the job should be removed from the list
