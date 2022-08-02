const { TestList } = require('./testlist.js');


var tests = new TestList();


tests.add().describe('Simple test that synchronously returns a value').expect(42).test(() => 42);

tests.add().describe('Simple test that asynchronously returns a value').expect(42).test(async () => 42);

tests.add().describe('Simple test that returns an explicit Promise').expect(42).test(() => new Promise(resolve => resolve(42)));

tests.add().describe('Simple test that returns an explicit Promise which resolves later').expect(42).test(() => new Promise(resolve => setTimeout(() => resolve(42), 1000)));

tests.add().describe('Simple test that uses a custom predicate function').expect(value => value > 5).test(() => 42);


tests.add().describe('Test should fail when an error is thrown from inside').expect(
	testList => 
		testList.runCount === 1 && 
		testList.succeedCount === 0 && 
		testList.tests[0].succeeded === false && 
		testList.tests[0].error.message === 'Error message here'
).test(async () => 
{
	let testList = new TestList();
	testList.add().describe('Test that throws an error').expect('foo').test(() => { throw new Error('Error message here') });
	await testList.run();
	return testList;
});


tests.add().describe('Test should fail when returned Promise rejects').expect(
	testList => 
		testList.runCount === 1 && 
		testList.succeedCount === 0 && 
		testList.tests[0].succeeded === false && 
		testList.tests[0].error === 'rejection'
).test(async () => 
{
	let testList = new TestList();
	testList.add().describe('Test that rejects a Promise').expect('foo').test(() => new Promise((resolve, reject) => setTimeout(reject, 500, 'rejection')));
	await testList.run();
	return testList;
});


tests.add().describe('Test should fail due to undefined function').expect(
	testList => 
		testList.runCount === 1 && 
		testList.succeedCount === 0 && 
		testList.tests[0].succeeded === false
).test(async () => 
{
	let testList = new TestList();
	testList.add().describe('Test that tries to call an undefined function').test(() => { undefinedFunction() });
	await testList.run();
	return testList;
});


tests.add().describe('Test should fail due to undefined property').expect(
	testList => 
		testList.runCount === 1 && 
		testList.succeedCount === 0 && 
		testList.tests[0].succeeded === false
).test(async () => 
{
	let testList = new TestList();
	testList.add().describe('Test that tries to access a property on an object that doesn\'t exist').test(() => foo.bar.baz);
	await testList.run();
	return testList;
});


tests.add().describe('Test should fail because there is no associated action to test').expect(
	testList => 
		testList.runCount === 1 && 
		testList.succeedCount === 0 && 
		testList.tests[0].succeeded === false
).test(async () => 
{
	let testList = new TestList();
	testList.add().describe('Test without an action');
	await testList.run();
	return testList;
});


tests.add().describe('Test should fail due to global timeout').expect(
	testList => 
		testList.runCount === 1 && 
		testList.succeedCount === 0 && 
		testList.tests[0].succeeded === false
).test(async () => 
{
	let testList = new TestList({ timeout: 500 });
	testList.add().describe('Long-running test').test(() => new Promise(resolve => setTimeout(() => resolve(42), 1000)));
	await testList.run();
	return testList;
});


tests.add().describe('Test should fail due to test-specific timeout').expect(
	testList => 
		testList.runCount === 1 && 
		testList.succeedCount === 0 && 
		testList.tests[0].succeeded === false
).test(async () => 
{
	let testList = new TestList();
	testList.add().describe('Long-running test').timeout(500).test(() => new Promise(resolve => setTimeout(() => resolve(42), 1000)));
	await testList.run();
	return testList;
});


tests.run().then(() => tests.printResults({ jsonResults: true }));
