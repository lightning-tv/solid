<style>
  img {
      transition: transform 0.25s ease;
  }

  img:hover {
      -webkit-transform: scale(1.8);
      transform: scale(1.8);
  }
</style>

# Lightning 3: Solid & Blits in the Real World

When it comes to **SolidJS** and **Blits**, a common question is: which is better suited for building performant, scalable web applications? To help answer this, let’s dive into a head-to-head comparison using the **TMDB (The Movie Database)** example app, exploring each framework’s performance, developer experience, and more.

## Overview: Solid vs. Blits

While not identical, the Solid and Blits TMDB versions are close enough to allow for a fair comparison. The **Solid** app includes a left navigation drawer, titles above rows, and leverages **Solid-UI components** and **SolidJS Router**. These extra features should give Blits a slight performance lead, yet as we’ll see, Solid still wins.

<div style="display: flex; justify-content: center; gap: 30px">
  <figure>
    <figcaption>
      <a href="https://lightning-tv.github.io/solid-demo-app/#/tmdb" target="_blank">Solid TMDB</a>
    </figcaption>
    <img src="images/compare/Solid-TMDB.png" alt="Solid TMDB">
  </figure>

  <figure>
    <figcaption>
      <a href="https://blits-demo.lightningjs.io/#/demos/tmdb" target="_blank">Blits TMDB</a>
    </figcaption>
    <img src="images/compare/Blits-TMDB.png" alt="Blits TMDB">
  </figure>
</div>

## Performance Comparison

So, how do these apps measure up in real-world performance? I tested both versions with a 20x CPU slowdown and cached networks using Chrome’s performance inspector.

<div style="display: flex; justify-content: center; gap: 30px">
  <figure>
    <figcaption>
      Solid Timeline
    </figcaption>
    <img src="images/compare/Solid-Timeline.png" alt="Solid Timeline">
  </figure>

  <figure>
    <figcaption>
      Blits Timeline
    </figcaption>
    <img src="images/compare/Blits-Timeline.png" alt="Blits Timeline">
  </figure>
</div>

SolidJS consistently loads in about **2.5 seconds**, compared to **3.5 seconds** for Blits—a 30% improvement in load time. For users, this means faster interactions and a more responsive feel, crucial for engagement. SolidJS’ speed advantage also grows with dynamic routing and **preloading capabilities**.

### Render as You Fetch

SolidJS takes things a step further by allowing **parallel data fetching** with the **Solid Router**'s preload function. When navigating from the Home page to an Entity page, Solid starts fetching data **before** the page load completes. This enables an Entity page to load in as little as **400ms**, making transitions seamless and near instant.

<div style="display: flex; justify-content: center; gap: 30px">
  <figure>
    <figcaption>Solid Home</figcaption>
    <img src="images/compare/Solid-Home.png" alt="Solid Home">
  </figure>

  <figure>
    <figcaption>
      Solid Entity
    </figcaption>
    <img src="images/compare/Solid-Entity.png" alt="Solid Entity">
  </figure>
</div>

Unfortunately, the Blits app doesn't have an Entity page, so no comparisons can be made. But right now the Blits Router doesn't support **render as you fetch**, so pages will need to load first and then data requested, leading to a slower page transition experience.

## Developer Experience

SolidJS offers a streamlined development process. In just a few hours, I was able to recreate the TMDB page from Blits with less code and reduced complexity. Solid’s **reusable components** and **flex layout** make it easy to maintain and scale applications, while familiarity with patterns from React keeps the learning curve low.

With Solid, setting up routes, API calls, and lazy-loaded rows is straightforward. Here’s an example of adding a route with preloaded data:

```jsx
<Route path="tmdb" component={TMDB} preload={tmdbData} />
```

And here’s how data is fetched for rows:

```js
export function tmdbData() {
  const rows: RowItem[] = [];

  const featured: RowItem = {
    title: "Popular Movies",
    // fetchPopular calls TMDB and returns a Promise,
    // createResource turns promises into Signals
    items: createResource(() => fetchPopular("movie"))[0],
    type: "Poster",
    height: 328,
  };

  rows.push(featured);

  rows.push({
    title: "Best Western movies",
    items: createResource(() => fetchGenreMovies(["Western"]))[0],
    type: "Hero",
    height: 720,
  });
  ...
  return { featured, rows };
}
```

This setup keeps UI components pure, focusing on display logic and leaving data fetching to separate functions. Inside of your page component you'll receive `props.data.featured` and `props.data.rows`. This also makes it easy to test your UI by just setting different props. You could easily do `<TMDBPage data={altData} />` and mock out different versions of the page for testing. Lastly, lets learn about some useful components features in the Solid Lightning Framework.

### Reusable Components

Solid’s ecosystem also includes versatile components like `<LazyUp>` and `<Dynamic>`. Here’s how we use these components to build the TDMB page:

```jsx
<LazyUp
  y={500}
  component={Column}
  direction="column"
  upCount={3}
  each={props.data.rows}
  id="BrowseColumn"
  onSelectedChanged={onSelectedChanged}
  autofocus={props.data.rows[0].items()}
  gap={40}
  transition={{ y: yTransition }}
  style={styles.Column}
>
  {(row) =>
    row().type === 'Hero' ? (
      <LazyUp
        component={Row}
        direction="row"
        gap={80}
        upCount={3}
        scroll="center"
        centerScroll
        each={row().items()}
        y={50}
        height={row().height}
      >
        {(item) => <Hero {...item()} />}
      </LazyUp>
    ) : (
      <TitleRow
        row={row()}
        title={row().title}
        height={row().height}
        items={row().items()}
      />
    )
  }
</LazyUp>
```

- **`<LazyUp>`**: Lazy-loads items in the Row or Column component, reducing initial render time.
- **`<Dynamic>`**: Dynamically renders components based on the item type, allowing single Column with different Row types like `Poster` or `Hero`.

And with the Row and Column components, you get access to new features like `scroll="center"` and `centerScroll`. `scroll="center"` aligns all items to the center of the screen, while `centerScroll` can be added to a single item to center it on the screen (useful for large Posters). For example:

<div style="display: flex; justify-content: center; gap: 30px">
  <figure>
    <figcaption>Solid Rows</figcaption>
    <img src="images/compare/Solid-Rows.png" alt="Solid Rows">
  </figure>
</div>
---

## Conclusion

SolidJS and Blits are both frameworks built on top of the Lightning 3 Renderer, allowing for immediate rendering with WebGL. But for speed, flexibility, and developer-friendly design, **SolidJS** stands out. Its open-source router, parallel data fetching, and reusable components make it a robust choice for real-world applications.

---

To learn more and get involved:

- **Official Website**: [lightningtv.dev](https://lightningtv.dev)
- **GitHub Repository**: [github.com/lightning-tv/solid](https://github.com/lightning-tv/solid)
- **Community Discord**: [Discord](https://discord.gg/HEqckxcB)
- **Connect with Me**: [Chris Lorenzo on LinkedIn](https://www.linkedin.com/in/chris-lorenzo/)
