<style>
  img {
      transition: transform 0.25s ease;
  }

  img:hover {
      -webkit-transform: scale(1.8);
      transform: scale(1.8);
      position: relative;
      z-index: 5;
  }
</style>

# Boosting LightningJS Performance by 50%

LightningJS has earned its reputation as a fast and capable framework for building TV applications. When Lightning 2.0 emerged, it set a new bar for what was possible on constrained TV hardware, offering a WebGL-based renderer that was lightweight, approachable for web developers, and performant enough to run smoothly even on most TV devices. For many teams, it became the de facto standard, and for good reason.

That legacy matters. LightningJS is a solid idea, built on a strong architectural foundation. Using WebGL for TV UIs is a smart choice, and the renderer exists thanks to a tremendous amount of thoughtful engineering. Credit is due to the people who carried Lightning this far; shout out to Frank and Jeffrey for building something that has enabled an entire ecosystem of TV applications.

Lightning 3.0 was introduced with the promise of moving that success forward. In some areas, it does. Node creation is faster, the internal structure is more modern, and the ambition to evolve the framework is clear. The potential is absolutely there. But in practice, especially on real TV hardware, Lightning 3 has not yet delivered the performance improvements many of us were hoping for.

This article is not a critique for its own sake. It is a call to the community and to the LightningJS team to focus together on what made Lightning successful in the first place: real, measurable performance on real devices.

---

## Building on Lightning 3 in the Real World

Over the last year, I built a SolidJS integration on top of the Lightning 3 renderer with a clear goal: to provide a highly performant, developer-friendly way to build production-grade TV apps.

From a developer experience perspective, the results were encouraging. SolidJS proved to be an excellent match: fine-grained reactivity, predictable updates, and access to a large, healthy open-source ecosystem. Teams enjoyed building with it, iteration was fast, and initial page loads were snappy.

However, once these applications reached real TV hardware, the experience changed. While startup performance was good, and pages loaded quickly, interaction performance was inconsistent. Animations felt heavier than expected. Basic navigation, something TV UIs must excel at, often fails to meet the smoothness bar users intuitively expect.

After extensive profiling and testing, one thing became clear: SolidJS was not the limiting factor. The bottleneck was the Lightning JS Renderer itself.

---

## From Assumptions to Evidence

Initially, it was reasonable to assume hardware limitations were the cause. TV devices are underpowered, and pushing pixels is expensive. Maybe 30 fps was the best that could be achieved? Maybe the latest beta of Lightning 3 Renderer will improve performance…

Instead, nearly a year after Lightning 3’s release, progress has centered around a prolonged beta with breaking changes but little measurable performance improvement. Text rendering has improved a bit. But these changes don’t help the render loop.

The original authors of Lightning 2 and Lightning 3 are no longer involved. With that transition, some of the hard-won institutional knowledge around renderer performance appears to have faded.

At the same time, there is a prevailing sense that the renderer is already well-optimized and continuing to improve. Unfortunately, extensive profiling and real-device testing do not support that conclusion. This disconnect creates a real risk: without deep familiarity with the renderer’s internals, performance issues can be underestimated, misdiagnosed, or deprioritized.

At this stage, meaningful gains will not come from surface-level changes, but from deliberate, informed work in the renderer’s hot paths. This is precisely the moment for renewed focus, not complacency. If LightningJS is to regain its performance leadership, rebuilding that depth of understanding must be treated as a priority.

---

## A Breaking Point: When “Good Enough” Wasn’t

One client project made the situation impossible to ignore. The UI was intentionally simple: a hero section at the top, followed by horizontally scrolling rows of content tiles. This is a common, well-understood TV layout, and it was aggressively optimized at the application level.

The feedback from the boss:

> “Scrolling between rows feels a bit slow on the box. Can we make it smoother?”

At that point, there was nothing left to optimize in the application code. The framework layer had been pushed as far as it reasonably could. The remaining bottleneck was the renderer.

So I started examining the renderer itself.

---

## Understanding the Renderer

Over the course of a month, I profiled the renderer deeply: the update loop, node lifecycle, shader switching, draw calls, garbage generation, and how state changes propagate frame to frame. This meant digging into WebGL internals and understanding exactly where time and memory were being spent.

WebGL is powerful, but it does not make performance problems disappear. At the end of the day, this is still JavaScript running tight loops on constrained hardware. Every allocation matters. Every unnecessary branch matters. Every redundant calculation matters. And in its current form, the renderer was simply doing too much work per frame.

---

## Fixing What Was Already There

One of the first discoveries was the number of subtle but impactful bugs in the renderer. These were not failures that caused crashes, but inefficiencies that quietly compounded over time. The update loop, in particular, was performing significant unnecessary work each frame, amplifying performance costs on constrained hardware.

I attempted to address these issues upstream by opening numerous pull requests. While some small fixes were ultimately accepted as bug corrections, discussion around performance implications was nonexistent, and to make an impactful performance difference would require a large refactor of the core.

This experience highlighted a broader challenge. Despite being positioned as a community-driven open-source project, there is limited transparency into current priorities, performance goals, or the renderer roadmap. Without clear signals around what is being optimized, why certain changes matter, or how contributors can meaningfully engage, collaboration is impossible.

This lack of clarity is also visible in long-standing feature requests with clear user impact. Right-to-left text support, for example, has been requested since January 2025, yet there is still no visible roadmap or guidance on when or how it will be addressed. This effectively excludes entire regions and languages from fully adopting LightningJS, not because of technical limitations, but because of prioritization.

Similarly, magic mouse support was started but never completed. After waiting without clarity on timelines or ownership, I ultimately implemented full support directly within the SolidJS integration in order to ship production applications over a year ago.

These are not edge cases. They illustrate a broader pattern: when priorities are opaque and follow-through is uncertain, contributors are forced to work around the platform rather than build alongside it.

---

## Garbage Collection: A Silent Performance Killer

Garbage collection proved to be another major factor.

On TV hardware, GC is unforgiving. Allocations inside high-frequency loops, temporary arrays, short-lived objects, and implicit allocations inevitably lead to unpredictable stutters when the collector runs.

The renderer was generating garbage continuously during the render loop. By restructuring this logic to reduce allocations as much as possible, the impact was immediate. GC pauses became rarer and shorter, and animations stopped hitching unpredictably.

This is not about clever tricks or clean code; it’s about respecting the realities of constrained devices. Reducing garbage pressure is critical to overall application performance.

---

## Doing Less Work Per Frame

A third major area of improvement was caching.

A surprising amount of work was being recomputed every frame, even when nothing had changed. By aggressively caching results and skipping unchanged states, the renderer simply did less work per frame. I still have a bunch of additional ideas to pursue in this area.

---

## Real-World Results

After fixing bugs in the update loop, eliminating garbage in hot paths, and caching work, the forked renderer consistently outperforms the upstream LightningJS renderer by approximately 50% in real-world scenarios.

Testing was done on a Raspberry Pi 3, a constrained device that closely mirrors the performance characteristics of low-end TV hardware. Using Lightning 3 beta v20, the upstream renderer averaged around 30 FPS in a representative TV UI. With the forked changes applied, the same application on the same device consistently exceeded 45 FPS.

These numbers come from real hardware, not desktop simulations, and the difference is immediately visible to end users.

Watch the video for yourself:
[Youtube](https://www.youtube.com/watch?v=byM5IzrLKJE)

---

## Looking Forward

At this point, continuing to upstream these changes no longer feels productive. The performance issues have been clearly identified, fixes have been proposed, and ample time has passed for review and discussion. That process has not resulted in meaningful action.

At the same time, this work represents a significant investment of time, expertise, and real-world validation. It would be irresponsible to discard it or indefinitely delay its use while teams shipping production applications continue to struggle with performance constraints.

For that reason, I am choosing a different path. The renderer improvements will be shared directly with the clients I work with, ensuring they can deliver the level of performance their products require. In parallel, I am exploring whether there is broader interest in accessing these updates and what a fair valuation for that work might be.

This is not an attempt to fragment the ecosystem, but to acknowledge reality. Historically, competition has been one of the most reliable drivers of innovation in open-source and platform ecosystems. When progress stalls, alternative implementations often serve as the catalyst for renewed focus, clearer priorities, and better outcomes for everyone involved.

---

To learn more and get involved:

- **Official Website**: [lightningtv.dev](https://lightningtv.dev)
- **GitHub Repository**: [github.com/lightning-tv/solid](https://github.com/lightning-tv/solid)
- **Community Discord**: [Discord](https://discord.gg/HEqckxcB)
- **Connect with Me**: [Chris Lorenzo on LinkedIn](https://www.linkedin.com/in/chris-lorenzo/)
