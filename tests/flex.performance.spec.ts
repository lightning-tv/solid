import { ElementNode } from '../src/elementNode.ts';
import calculateFlex from '../src/flex.ts';
import {
  describe,
  it,
  vi,
  beforeEach,
  afterEach,
  expect,
  afterAll,
} from 'vitest';
import fs from 'fs';
import path from 'path';
import { isElementNode } from '../src/utils.ts'; // Assuming isElementText and isTextNode are not directly needed for createTestElement logic here

// Helper to create a basic ElementNode for flex testing
function createTestElement(
  initialProps: Partial<ElementNode> & {
    nodeType?: 'element' | 'textNode';
  } = {},
): ElementNode {
  const nodeTypeName =
    initialProps.nodeType === 'textNode' ? 'text' : 'element';
  const node = new ElementNode(nodeTypeName);

  // Assign all properties. The ElementNode's own setters will handle lng delegation.
  for (const key in initialProps) {
    if (Object.prototype.hasOwnProperty.call(initialProps, key)) {
      if (key === 'children') continue; // Handled below
      if (key === 'nodeType') continue; // Handled above
      (node as any)[key] = (initialProps as any)[key];
    }
  }

  // Ensure essential dimension properties are initialized on lng via setters if not explicitly set
  // This ensures their getters return a number, as flex calculations expect.
  node.x = node.x || 0;
  node.y = node.y || 0;
  node.width = node.width || 0;
  node.height = node.height || 0;

  if (initialProps.children) {
    node.children = initialProps.children as Array<ElementNode>; // ElementText is a type of ElementNode
    node.children.forEach((child) => {
      if (isElementNode(child)) {
        child.parent = node;
        child.rendered = true;
        // Ensure children also have their dimensions initialized
        child.width = child.width || 0;
        child.height = child.height || 0;
        child.x = child.x || 0;
        child.y = child.y || 0;
      }
    });
  } else {
    node.children = [];
  }

  node.rendered = true; // Assume rendered for layout calculations
  return node;
}

// Mock console.warn to avoid noise during tests (e.g., for negative growFactor)
// Use vi.fn() for Vitest
let originalConsoleWarn: (...data: any[]) => void;
beforeEach(() => {
  originalConsoleWarn = console.warn;
  console.warn = vi.fn();
});
afterEach(() => {
  console.warn = originalConsoleWarn;
});

const RESULTS_FILE_PATH = path.join(__dirname, 'flex-perf-results.json');
const REGRESSION_THRESHOLD_PERCENTAGE = 10; // 10% slowdown is a regression
const NUM_TEST_RUNS = 3; // Number of times to run each test for averaging

interface PerformanceResult {
  id: string; // Unique ID for a test case: scenarioName + numChildren
  scenarioName: string;
  numChildren: number;
  durationMs: number;
  containerUpdated: boolean;
}

interface PerformanceRunData {
  timestamp: string;
  results: PerformanceResult[];
}

const currentRunResults: PerformanceResult[] = [];
let previousRunData: PerformanceRunData | null = null;

// Check if fs module is available (for Node.js environment)
const isFsAvailable =
  typeof fs !== 'undefined' &&
  typeof fs.existsSync === 'function' &&
  typeof fs.readFileSync === 'function' &&
  typeof fs.writeFileSync === 'function';

describe('Flexbox Performance Tests (calculateFlex)', () => {
  const scenarios = [
    {
      name: 'Row, FlexStart, NoGrow',
      // To ensure the test setup is minimal and doesn't rely on renderer for basic ElementNode creation
      // we'll assume the `startLightningRenderer` call in a `beforeAll` is for more complex scenarios
      // or if ElementNode setters have deep renderer interactions not covered by simple prop assignment.
      parentProps: { flexDirection: 'row', justifyContent: 'flexStart' },
      childProps: { width: 50, height: 50 },
    },
    {
      name: 'Column, Center, WithGrow',
      parentProps: { flexDirection: 'column', justifyContent: 'center' },
      childProps: { width: 50, height: 50, flexGrow: 1 },
    },
    {
      name: 'Row, SpaceBetween, MixedGrow',
      parentProps: { flexDirection: 'row', justifyContent: 'spaceBetween' },
      childPropsFn: (i: number) => ({
        width: 50,
        height: 50,
        flexGrow: i % 2,
      }),
    },
    {
      name: 'Row, Wrap, FlexStart',
      parentProps: {
        flexDirection: 'row',
        justifyContent: 'flexStart',
        flexWrap: 'wrap',
        width: 300, // Container width that forces wrapping
      },
      childProps: { width: 100, height: 50 },
    },
    {
      name: 'Row, RTL, FlexEnd',
      parentProps: {
        flexDirection: 'row',
        justifyContent: 'flexEnd',
        direction: 'rtl',
      },
      childProps: { width: 50, height: 50 },
    },
    {
      name: 'Row, WithOrder',
      parentProps: { flexDirection: 'row', justifyContent: 'flexStart' },
      childPropsFn: (i: number, total: number) => ({
        width: 50,
        height: 50,
        flexOrder: total - i,
      }),
    },
    {
      name: 'Row, FlexStart, WithMargins',
      parentProps: { flexDirection: 'row', justifyContent: 'flexStart' },
      childProps: {
        width: 50,
        height: 50,
        marginLeft: 5,
        marginRight: 5,
        marginTop: 2,
        marginBottom: 2,
      },
    },
    {
      name: 'Row, FlexStart, WithGap',
      parentProps: {
        flexDirection: 'row',
        justifyContent: 'flexStart',
        gap: 10,
      },
      childProps: { width: 50, height: 50 },
    },
    {
      name: 'Row, FlexStart, AlignCenter (Cross Axis)',
      parentProps: {
        flexDirection: 'row',
        justifyContent: 'flexStart',
        alignItems: 'center',
        height: 200, // Parent height for alignment context
      },
      childProps: { width: 50, height: 50 },
    },
    {
      name: 'Row, FlexStart, AlignSelf (Cross Axis)',
      parentProps: {
        flexDirection: 'row',
        justifyContent: 'flexStart',
        alignItems: 'flexStart', // Default alignment
        height: 200,
      },
      childPropsFn: (i: number) => ({
        width: 50,
        height: 50,
        alignSelf:
          i % 3 === 0 ? 'center' : i % 3 === 1 ? 'flexEnd' : 'flexStart',
      }),
    },
  ];

  const childCounts = [3, 5, 10, 15, 20, 50, 100]; // Number of children to test

  // Try to load previous results before tests run
  if (isFsAvailable) {
    if (fs.existsSync(RESULTS_FILE_PATH)) {
      previousRunData = JSON.parse(fs.readFileSync(RESULTS_FILE_PATH, 'utf-8'));
    }
  }

  scenarios.forEach((scenario) => {
    describe(`Scenario: ${scenario.name}`, () => {
      childCounts.forEach((numChildren) => {
        // Test names need to be unique if you use `it.each` or similar advanced Jest features
        it(`should perform layout for ${numChildren} children`, () => {
          const parentNode = createTestElement({
            display: 'flex',
            width: scenario.parentProps.width ?? 600, // Default parent width
            height: scenario.parentProps.height ?? 600, // Default parent height
            children: [], // Will be populated
            ...scenario.parentProps,
            // @ts-ignore - Type 'string' is not assignable to type 'FlexDirection'.
            flexDirection: scenario.parentProps.flexDirection,
          });

          for (let i = 0; i < numChildren; i++) {
            let currentChildProps = {};
            if (scenario.childPropsFn) {
              currentChildProps = scenario.childPropsFn(i, numChildren);
            } else {
              currentChildProps = scenario.childProps || {};
            }
            const childNode = createTestElement({
              // parent will be set by createTestElement if passed in children,
              // or manually if children are pushed one by one.
              // Here, we push to parentNode.children AFTER creating child.
              ...currentChildProps,
            });
            childNode.parent = parentNode; // Explicitly set parent
            parentNode.children.push(childNode);
          }

          let totalDuration = 0;
          let lastContainerUpdatedStatus = false;

          for (let run = 0; run < NUM_TEST_RUNS; run++) {
            const startTime = performance.now();
            lastContainerUpdatedStatus = calculateFlex(parentNode);
            const endTime = performance.now();
            totalDuration += endTime - startTime;
          }

          const averageDuration = totalDuration / NUM_TEST_RUNS;

          const resultId = `${scenario.name}-${numChildren}`;
          currentRunResults.push({
            id: resultId,
            scenarioName: scenario.name,
            numChildren: numChildren,
            durationMs: averageDuration,
            containerUpdated: lastContainerUpdatedStatus, // Use status from the last run
          });

          // Outputting to console. In a CI/benchmark setup, you'd log this to a file or service.
          // Using a template literal to make it easy to copy-paste into a spreadsheet.
          console.log(
            `FlexPerf Immediate; ${scenario.name}; ${numChildren}; ${averageDuration.toFixed(3)};`,
          );

          // Basic assertion: layout should generally take less than a few milliseconds for these counts.
          // This threshold is arbitrary and should be adjusted based on your performance targets.
          expect(averageDuration).toBeLessThan(10); // e.g., 10ms, check average

          // Optional: Add functional assertions to ensure layout is somewhat correct
          if (numChildren > 0 && parentNode.children[0]) {
            const firstChild = parentNode.children[0] as ElementNode;
            if (parentNode.flexDirection === 'column') {
              expect(firstChild.y).toBeDefined();
            } else {
              // Default or 'row'
              expect(firstChild.x).toBeDefined();
            }
          }
        });
      });
    });
  });

  afterAll(() => {
    // Save current results
    const currentRunData: PerformanceRunData = {
      timestamp: new Date().toISOString(),
      results: currentRunResults,
    };
    if (isFsAvailable) {
      fs.writeFileSync(
        RESULTS_FILE_PATH,
        JSON.stringify(currentRunData, null, 2),
      );
      console.log(`Performance results saved to ${RESULTS_FILE_PATH}`);
    } else {
      console.log(
        'File system not available. Performance results not saved to disk.',
      );
    }

    // Compare with previous results if available
    if (previousRunData) {
      console.log('\n--- Performance Comparison ---');
      console.log(`Previous run: ${previousRunData.timestamp}`);
      console.log(`Current run: ${currentRunData.timestamp}`);

      const previousResultsMap = new Map<string, PerformanceResult>(
        previousRunData.results.map((r) => [r.id, r]),
      );

      currentRunResults.forEach((currentResult) => {
        const prevResult = previousResultsMap.get(currentResult.id);
        if (prevResult) {
          const diff = currentResult.durationMs - prevResult.durationMs;
          const percentageChange =
            prevResult.durationMs === 0
              ? currentResult.durationMs > 0
                ? Infinity
                : 0
              : (diff / prevResult.durationMs) * 100;

          let logMessage = `  ${currentResult.scenarioName} (${currentResult.numChildren} children): ${currentResult.durationMs.toFixed(3)}ms (prev: ${prevResult.durationMs.toFixed(3)}ms, change: ${diff.toFixed(3)}ms, ${percentageChange.toFixed(2)}%)`;

          if (percentageChange > REGRESSION_THRESHOLD_PERCENTAGE) {
            logMessage += ' - REGRESSION DETECTED';
            // You could add an expect here to fail the build if desired:
            // expect(percentageChange).toBeLessThanOrEqual(REGRESSION_THRESHOLD_PERCENTAGE);
          } else if (percentageChange < -REGRESSION_THRESHOLD_PERCENTAGE) {
            logMessage += ' - IMPROVEMENT DETECTED';
          }
          console.log(logMessage);
          previousResultsMap.delete(currentResult.id); // Mark as processed
        } else {
          console.log(
            `  ${currentResult.scenarioName} (${currentResult.numChildren} children): ${currentResult.durationMs.toFixed(3)}ms (New test)`,
          );
        }
      });

      previousResultsMap.forEach((removedTest) => {
        console.log(
          `  ${removedTest.scenarioName} (${removedTest.numChildren} children): (Test removed or not run in current suite)`,
        );
      });
    }
  });
});
