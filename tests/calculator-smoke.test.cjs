const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const start = source.indexOf('function normalizeMathInput');
const end = source.indexOf('function calculatorMessage', start);
assert.ok(start >= 0 && end > start, 'calculator parser block must exist');
const context = vm.createContext({ Math, Number, String, Error });
vm.runInContext(source.slice(start, end) +
  '; this.calculator = { safeEvaluate, solveLinearEquation, formatCalculatorNumber };', context);
const { safeEvaluate, solveLinearEquation } = context.calculator;

const arithmetic = [
  ['2+3*4', 14],
  ['(2+3)*4', 20],
  ['-2^2', -4],
  ['2^3^2', 512],
  ['√81', 9],
  ['2(3+4)', 14],
  ['۳×۴', 12],
  ['1.5+2.25', 3.75],
  ['(8-3)%2', 1],
  ['√(9)', 3],
];
for (const [expression, expected] of arithmetic) {
  test(`calculator evaluates ${expression}`, () => {
    assert.ok(Math.abs(safeEvaluate(expression) - expected) < 1e-10);
  });
}

const equations = [
  ['2x+3=11', { type: 'solution', value: 4 }],
  ['3(x-2)=9', { type: 'solution', value: 5 }],
  ['x+2=x+2', { type: 'infinite' }],
  ['x+2=x+3', { type: 'none' }],
  ['۲x=۱۰', { type: 'solution', value: 5 }],
];
for (const [equation, expected] of equations) {
  test(`linear solver handles ${equation}`, () => {
    const result = solveLinearEquation(equation);
    assert.equal(result.type, expected.type);
    if (expected.type === 'solution') assert.ok(Math.abs(result.value - expected.value) < 1e-10);
  });
}

test('calculator rejects division by zero', () => {
  assert.throws(() => safeEvaluate('1/0'), error => error.message === 'zero');
});
test('calculator rejects square root of a negative number', () => {
  assert.throws(() => safeEvaluate('√(-1)'), error => error.message === 'sqrt');
});

test('game icon source paths match the requested assets', () => {
  assert.match(source, /game-icon-2048[^`]*assets\/icons\/2048\.svg/);
  assert.match(source, /game-icon-puzzle[^`]*assets\/icons\/question-mark\.svg/);
  assert.match(source, /game-icon-memory[^`]*assets\/icons\/brain\.svg/);
  assert.match(source, /game-icon-missing[^`]*assets\/icons\/lost-number\.svg/);
  assert.match(source, /data-fallback-src=\"\$\{resolveSiteAsset\('assets\/icons\/number-123\.svg'\)\}\"/);
});

test('missing-number image switches to number-123.svg after an image load error', () => {
  const start = source.indexOf('// The final requested missing-number icon is lost-number.svg; number-123.svg is a safe fallback.');
  const end = source.indexOf("gameRoot.addEventListener('pointerdown',e=>{const button=e.target.closest('button')", start);
  assert.ok(start >= 0 && end > start, 'fallback listener block must exist');
  let errorHandler;
  class FakeHTMLImageElement {
    constructor() {
      this.classList = { contains: name => name === 'game-icon-missing' };
      this.dataset = { fallbackSrc: 'assets/icons/number-123.svg' };
      this.src = 'assets/icons/lost-number.svg';
    }
  }
  const fakeGameRoot = {
    addEventListener(type, handler, capture) {
      if (type === 'error' && capture === true) errorHandler = handler;
    }
  };
  const sandbox = vm.createContext({ gameRoot: fakeGameRoot, HTMLImageElement: FakeHTMLImageElement });
  vm.runInContext(source.slice(start, end), sandbox);
  assert.equal(typeof errorHandler, 'function');
  const image = new FakeHTMLImageElement();
  errorHandler({ target: image });
  assert.equal(image.src, 'assets/icons/number-123.svg');
  assert.equal(image.dataset.fallbackTried, '1');
  errorHandler({ target: image });
  assert.equal(image.src, 'assets/icons/number-123.svg');
});
