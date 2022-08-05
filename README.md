# test-ease

This is designed to be a no-frills testing framework you can learn in a few minutes. It started as part of a larger project when I looked around for a 
simple, compact, straightforward testing framework and couldn't find one. It might not be the best choice for very large, complex projects, but for 
small-to-medium projects, it should make things quick and easy with no added dependencies. It uses descriptive, explicit syntax for creating and running 
tests, and supports asynchronous code, error handling, timeouts (both global and per-test), and flexible expected values.

## How to use

Add it to your project:

```
npm install --save-dev test-ease
```

Import it into one or more test scripts, along with whatever you want to test:

```javascript
//For ES Module files, typically with a *.mjs extension or with "type" set to "module" in package.json:
import { TestList } from 'test-ease';

//For CommonJS files, typically with a *.js extension:
const { TestList } = require('test-ease');
```

Create a list of tests:

```javascript
var tests = new TestList();
```

Define your tests using the descriptive, chainable functions:

```javascript
tests.add().describe('Test something').expect(42).test(() => {...});
```

Run your tests after adding them to the list. You might want to print the results at the same time:

```javascript
tests.run().then(() => tests.printResults({ jsonResults: true }));
```

Use your test script(s) directly to perform testing, e.g.

```
node tests.js
```

## API Reference

### TestList

Everything in `test-ease` revolves around the `TestList` object. A `TestList` is a self-contained set of tests which go together.

#### constructor(options)

Creates a new `TestList` with an options object which can contain a `timeout` value (in milliseconds) which applies to all asynchronous 
tests if specified. The timeout and the whole options object are optional.

#### add()

Adds a new `Test` object to the list and returns it. Note that all the test definition functions return a reference to the same test, 
so they can be chained together.

#### run()

Runs all the tests in the list, returning a Promise (since it's an async function) that will resolve with no value when the tests 
are finished running.

#### printResults(options)

Prints the results of the tests to the console after running. `options` is an optional object that can have the following properties:
- `print = String { 'all' | 'succeeded' | 'failed' }`: determines which tests from the list to print based on their final status.
- `jsonResults = { true | false }`: whether to print test results using `JSON.stringify()` or not.
- `processResults = <function>`: if `jsonResults` is not true, specifies an alternate function to process each test result with before printing.

### Test

`Test` is an internal class which is not exported, but it is still very important since a `TestList` contains `Test` objects which do 
the actual work. As mentioned earlier, all `Test` functions used for defining each test will return a reference to the same `Test` 
object for easy chaining.

#### describe(description)

Sets a human-readable description for the test. This value is not used in any way other than in output to identify each test to the user. 
Technically, you can put absolutely anything you want in here, and it doesn't have to be human-readable at all. That would kind of defeat 
the purpose though, and it would make your job harder if your test descriptions aren't... well... descriptive.

#### test(action)

Sets an action for the `Test` to test. `action` should be a function which does something that needs to be tested. If `action` returns a 
value, that can be compared against an expected value using `expect()` (see below). If there is no expected value or predicate, the test 
will succeed if `action` completes successfully and fail if it throws an error. `action` can be async or even directly return a `Promise`.

#### timeout(milliseconds)

Sets a timeout duration specific to this test. If the function set by `.action()` is asynchronous and does not finish or fail before this 
limit, the test will fail. If a test-specific timeout is set, that overrides any global timeout set on the `TestList`.

#### expect(what)

Sets an expectation about the result of the test, i.e. the return value from the function set by `.test()`. This can be a simple JavaScript 
value, in which case it is compared to the return value with the strict equality (`===`) operator, or it can be a predicate function which 
takes one parameter and returns true or false. For example, this predicate would check whether the test result is greater than five:
`value => value > 5`.

#### run(defaultTimeout)

Used internally by `TestList`. In general you shouldn't have to use this function. Call `run()` on the `TestList` instead to run all the 
tests at once. If you do need to use this function for some reason, `defaultTimeout` is the global timeout propagated down to each test 
from the `TestList` (i.e. the default if the individual test doesn't have a timeout specified), and `run()` returns a Promise which either
resolves to `true` if the test is successful or rejects if any error was encountered.


## Miscellaneous

Here's something interesting I learned while writing this: if you define a module with a CommonJS-style export, for example 
`module.exports = { TestList };`, you can import it using the good 'ol `require()` syntax _or_ the fancy new(ish) `import` syntax. 
However, if you define a module with the newer ES Module `export` statement, e.g. `export { TestList };`, you can _only_ import 
that module using the corresponding ES Module `import`. There's at least one [Stack Overflow thread](https://stackoverflow.com/questions/69081410/error-err-require-esm-require-of-es-module-not-supported) about this, with various libraries becoming incompatible with `require()` by choice.

I debated with myself for a little while whether to do the same and fully embrace ES Modules. I made the decision to retain support 
for CommonJS code since the whole point of this project is to _lower_ barriers to using it. I'm not giving anything up by doing so, 
just the bragging rights of having that shiny little `export` statement at the bottom of my code, I guess. If that means ensuring 
compatibility with a vastly larger set of code that might need testing, that's a sacrifice I'm willing to make. Using a CommonJS 
export still allows compatibility with newer code using `import`, so there doesn't seem to be much of a downside.

If a test is run with a synchronous action function, timeouts won't be enforced since those are started after the test action and 
rely on the event loop. Given JavaScript's highly single-threaded nature, this isn't really fixable without adding platform-specific 
dependencies to support multithreading. Since I don't consider timeouts to be a critical feature, my advice is to use asynchronous 
test actions as much as possible, especially for tests that may run long or need to wait on time-consuming operations like I/O. I 
was hoping to be able to find a fix for this shortcoming, but the more I thought it through, I realized it wasn't really feasible 
if I want to keep this package simple and compact.
