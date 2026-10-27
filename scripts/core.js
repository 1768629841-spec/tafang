(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IdolCore = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function requireCondition(condition, message) {
    if (!condition) throw new Error(message);
  }

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function requireText(value, location) {
    requireCondition(typeof value === 'string' && value.trim().length > 0, location + ' must be nonempty text.');
  }

  function requireId(value, location, seen) {
    requireText(value, location + '.id');
    requireCondition(value === value.trim(), location + '.id must not contain surrounding whitespace.');
    requireCondition(!seen.has(value), location + ' has duplicate ID "' + value + '".');
    seen.add(value);
  }

  function requireItems(value, location, count) {
    requireCondition(Array.isArray(value) && value.length > 0, location + ' must be a nonempty array.');
    if (count !== undefined) requireCondition(value.length === count, location + ' must contain exactly ' + count + ' items.');
    for (var index = 0; index < value.length; index += 1) {
      requireCondition(Object.prototype.hasOwnProperty.call(value, index), location + '[' + index + '] must not be missing.');
    }
  }

  function validateData(questionData, resultData) {
    requireCondition(isRecord(questionData), 'questionData must be an object.');
    requireCondition(isRecord(resultData), 'resultData must be an object.');
    requireCondition(questionData.version === 1 && resultData.version === 1, 'Data version must be 1.');
    requireItems(questionData.questions, 'questions');
    requireItems(resultData.results, 'results');

    var resultIds = new Set();
    resultData.results.forEach(function (result, resultIndex) {
      var location = 'results[' + resultIndex + ']';
      requireCondition(isRecord(result), location + ' must be an object.');
      requireId(result.id, location, resultIds);
      ['name', 'english', 'kicker', 'tagline', 'position', 'core', 'quote', 'scene', 'advice'].forEach(function (field) {
        requireText(result[field], location + '.' + field);
      });
      requireCondition(typeof result.color === 'string' && /^#[0-9a-f]{6}$/i.test(result.color), location + '.color must be a six-digit hex color.');
      requireItems(result.tags, location + '.tags');
      result.tags.forEach(function (tag, index) { requireText(tag, location + '.tags[' + index + ']'); });
      requireItems(result.stats, location + '.stats', 6);
      result.stats.forEach(function (stat, index) {
        var statLocation = location + '.stats[' + index + ']';
        requireCondition(isRecord(stat), statLocation + ' must be an object.');
        requireText(stat.label, statLocation + '.label');
        requireCondition(Number.isInteger(stat.value) && stat.value >= 1 && stat.value <= 5, statLocation + '.value must be an integer from 1 to 5.');
      });
      requireItems(result.fans, location + '.fans', 4);
      var fanTotal = 0;
      result.fans.forEach(function (fan, index) {
        var fanLocation = location + '.fans[' + index + ']';
        requireCondition(isRecord(fan), fanLocation + ' must be an object.');
        requireText(fan.label, fanLocation + '.label');
        requireCondition(Number.isFinite(fan.value) && fan.value >= 0 && fan.value <= 100, fanLocation + '.value must be a percentage from 0 to 100.');
        fanTotal += fan.value;
      });
      requireCondition(Math.abs(fanTotal - 100) < 1e-9, location + '.fans percentages must sum to 100.');
    });

    requireItems(resultData.tieBreakOrder, 'tieBreakOrder');
    requireCondition(resultData.tieBreakOrder.length === resultIds.size, 'tieBreakOrder must include every result ID exactly once.');
    var priorityIds = new Set();
    resultData.tieBreakOrder.forEach(function (id) {
      requireCondition(resultIds.has(id) && !priorityIds.has(id), 'tieBreakOrder contains an unknown or duplicate result ID: ' + String(id));
      priorityIds.add(id);
    });

    var questionIds = new Set();
    questionData.questions.forEach(function (question, questionIndex) {
      var location = 'questions[' + questionIndex + ']';
      requireCondition(isRecord(question), location + ' must be an object.');
      requireId(question.id, location, questionIds);
      requireText(question.chapter, location + '.chapter');
      requireText(question.title, location + '.title');
      requireItems(question.options, location + '.options', 4);
      var optionIds = new Set();
      question.options.forEach(function (option, optionIndex) {
        var optionLocation = location + '.options[' + optionIndex + ']';
        requireCondition(isRecord(option), optionLocation + ' must be an object.');
        requireId(option.id, optionLocation, optionIds);
        requireText(option.text, optionLocation + '.text');
        requireCondition(isRecord(option.scores), optionLocation + '.scores must be an object.');
        var hasPositiveWeight = false;
        Object.keys(option.scores).forEach(function (id) {
          requireCondition(resultIds.has(id), optionLocation + '.scores contains unknown result ID "' + id + '".');
          var weight = option.scores[id];
          requireCondition(Number.isFinite(weight) && weight >= 0, optionLocation + '.scores[' + id + '] weight must be finite and nonnegative.');
          if (weight > 0) hasPositiveWeight = true;
        });
        requireCondition(hasPositiveWeight, optionLocation + '.scores must contain at least one positive weight.');
      });
    });
    return true;
  }

  function calculateResult(questions, resultsData, answers) {
    validateData({ version: 1, questions: questions }, resultsData);
    requireCondition(Array.isArray(answers) && answers.length === questions.length, 'answers must contain exactly one option ID for every question.');
    // fromEntries creates own properties even for data IDs such as "__proto__".
    var scores = Object.fromEntries(resultsData.tieBreakOrder.map(function (id) { return [id, 0]; }));
    questions.forEach(function (question, index) {
      var answer = answers[index];
      requireCondition(typeof answer === 'string', 'answers[' + index + '] must be an option ID.');
      var option = question.options.find(function (candidate) { return candidate.id === answer; });
      requireCondition(Boolean(option), 'answers[' + index + '] contains an unknown option ID for question "' + question.id + '".');
      Object.keys(option.scores).forEach(function (id) {
        scores[id] += option.scores[id];
        requireCondition(Number.isFinite(scores[id]), 'Score overflow: result "' + id + '" must have a finite total.');
      });
    });
    var maximum = Math.max.apply(null, resultsData.tieBreakOrder.map(function (id) { return scores[id]; }));
    var tiedIds = resultsData.tieBreakOrder.filter(function (id) { return scores[id] === maximum; });
    return { resultId: tiedIds[0], scores: scores, tiedIds: tiedIds };
  }

  return Object.freeze({ validateData: validateData, calculateResult: calculateResult });
}));
