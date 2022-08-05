//Internal class that represents a single test.
class Test
{
	constructor()
	{
	}
	
	
	//Sets a human-readable description for this test.
	describe(description)
	{
		this.description = description;
		return this;
	}
	
	
	//Sets the logic for this test case. 'action' should be a function which will be called when the test is run, and can return a result value to be checked.
	test(action)
	{
		this.action = action;
		return this;
	}
	
	
	//Sets a timeout in milliseconds for this test. If an asynchronous test runs longer than this, it will fail.
	timeout(milliseconds)
	{
		this.timeoutDuration = milliseconds;
		return this;
	}
	
	
	//Sets a predicate function for checking whether the result from running a test is expected.
	//If the provided value is not a function, one is created that just uses the strict equality operator.
	expect(what)
	{
		if(typeof what === 'function')
		{
			this.resultPredicate = what;
		}
		else
		{
			this.resultPredicate = (value) => value === what;
		}
		
		return this;
	}
	
	
	//Runs this test. The returned Promise resolves to 'true' if the test is successful and rejects otherwise.
	//If a test-specific timeout has been set, that value will be used and the defaultTimeout parameter will be ignored.
	//If there is no test-specific timeout and defaultTimeout is specified, that timeout value will be used. If neither 
	//is specified, the test will not time out and will continue as long as the test action takes to run. Note that all 
	//timeout values are in milliseconds.
	async run(defaultTimeout)
	{
		try
		{
			//Use either the test-specific timeout or the global timeout passed in from the TestList, in that order.
			let duration = this.timeoutDuration || defaultTimeout;
			//If this.action() is synchronous and takes a while to run, this code will not be able to enforce a timeout.
			//It's a good idea to use async actions, especially for tests that could take a long time to run or need to 
			//perform tasks like waiting for I/O.
			let resultPromise = this.action();
			
			if(duration)
			{
				//Set up a timer to automatically fail the test if it hasn't completed after a certain amount of time.
				let timer;
				let timeoutPromise = new Promise((resolve, reject) => timer = setTimeout(() => reject(new Error('Timed out.')), duration));
				
				this.result = await Promise.race([timeoutPromise, resultPromise]);
				//If Promise.race() resolved, that means the timeout did not trigger yet, so cancel it before it does.
				clearTimeout(timer);
			}
			else
			{
				//If neither timeout duration was specified, just wait however long the result takes.
				this.result = await resultPromise;
			}
			
			//If this test has a result predicate function set, use it to check for whether the result is expected. If not, throw an error.
			if(this.resultPredicate && !this.resultPredicate(this.result)) throw new Error('Unexpected result value.');
			
			this.succeeded = true;
			return true;
		}
		catch(error)
		{
			this.error = error;
			this.succeeded = false;
			throw error;
		}
	}
}


//Main class which contains a list of tests.
class TestList
{
	constructor(options)
	{
		this.tests = [];
		this.timeout = options?.timeout;
	}
	
	
	//Adds a test to the list and returns the new Test object. Note that most functions on the Test object will return 
	//a reference back to it for chaining.
	add()
	{
		let test = new Test();
		this.tests.push(test);
		test.index = this.tests.length - 1;
		return test;
	}
	
	
	//Runs all tests in the list. Tests are not guaranteed to finish in any specific order.
	async run()
	{
		this.runCount = 0;
		this.succeedCount = 0;
		
		let results = this.tests.map(test => test.run(this.timeout));
		
		await Promise.allSettled(results);
		this.runCount = results.length;
		this.succeedCount = this.tests.filter(test => test.succeeded).length;
		
		return this.runCount == this.succeedCount;
	}
	
	
	//Prints the results of a previously run set of tests. Available options are:
	//  .print = String { 'all' | 'succeeded' | 'failed' }: determines which tests from the list to print based on their final status.
	//  .jsonResults = { true | false }: whether to print test results using JSON.stringify() or not.
	//  .processResults = <function>: if jsonResults is not true, specifies an alternate function to process each test result with before printing.
	printResults(options)
	{
		for(let test of this.tests)
		{
			if(!options?.print || options?.print === 'all' || (options?.print === 'succeeded' && test.succeeded) || (options?.print === 'failed' && !test.succeeded))
			{
				console.log(`Test ${test.index + 1}: ${test.description}`);
				
				if(options?.jsonResults)         console.log(`Result: ${JSON.stringify(test.result)}`);
				else if(options?.processResults) console.log(`Result: ${options.processResults(test.result)}`);
				else                             console.log(`Result: ${test.result}`);
				
				console.log(`Status: ${test.succeeded ? 'success' : 'fail'}`);
				if(!test.succeeded) console.log(`Reason: ${test.error?.toString()}`);
				console.log();
			}
		}
		
		console.log(`${this.succeedCount}/${this.runCount} succeeded (${(this.succeedCount / this.runCount * 100).toFixed(2)}%)`);
	}
}


module.exports = { TestList };
