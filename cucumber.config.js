module.exports = {
  default: {
    paths: ['tests/ui/features/**/*.feature'],
    require: ['tests/ui/steps/**/*.ts', 'tests/ui/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'json:results/cucumber-report.json',
    ],
    publishQuiet: true,
  },
};
