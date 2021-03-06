<template>
  <div id="app">
    <h3>Today vs Past</h3>
    <div class='info' v-html="subtitle"></div>
    <div v-if='loading'>Loading archive from the past...</div>
    <div v-if='error'>
      <div class='error'>{{this.error}}</div>
      <div class='error'>Please <a href='https://twitter.com/anvaka' target='_blank'>ping anvaka@</a> to get this fixed</div>
    </div>
    <canvas ref='scene'></canvas>
    <post-selector :subreddit='subreddit' @loaded='onPostsLoaded' @selected='onPostSelected' :archive='archive'></post-selector>
  </div>
</template>

<script>
import fetchArchive from './lib/fetchArchive';
import formatNumber from './lib/formatNumber';
import PostSelector from './components/PostSelector';
import createSceneRenderer from './lib/createSceneRenderer';

export default {
  name: 'App',

  components: {
    PostSelector
  },

  data() {
    return {
      archive: null,
      loading: true,
      postCount: 0,
      error: null,
      subreddit: '/r/dataisbeautiful'
    };
  },
  computed: {
    subtitle() {
      const prefix = `Compare today's scores in <a href='https://www.reddit.com${this.subreddit}'>${this.subreddit}</a> with`;
      const suffix = ' posts in the past.';
      return prefix + (this.isLoading ? suffix : ' ' + formatNumber(this.postCount) + ' ' + suffix);
    }
  },

  methods: {
    ensurePostsAreRendered() {
      if (!this.sceneRenderer || !this.posts) {
        return;
      }
      this.sceneRenderer.renderPosts(this.posts);
    },

    onPostsLoaded(posts) {
      this.posts = posts;
      this.ensurePostsAreRendered();
    },

    onPostSelected(post) {
      this.sceneRenderer.selectPost(post);
    }
  },

  mounted() {
    fetchArchive().then((archive) => {
      this.loading = false;
      this.archive = archive;
      this.postCount = archive.postCount;
      this.sceneRenderer = createSceneRenderer(archive, this.$refs.scene)
      this.ensurePostsAreRendered();
    })
    .catch(e => {
      this.loading = false;
      this.error = 'Could not download archive. ' + e + '.';
      console.error('Could not download archive', e);
      debugger;
    });
  },

  beforeDestroy() {
    this.sceneRenderer.dispose();
  },
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 8px;
  text-align: center;
}
h3 {
  font-weight: normal;
  font-size: 21px;
  margin: 0;
}
.info {
  max-width: 640px;
  color: #333;
  font-size: 14px;
  margin: auto;

}
.error {
  font-family: monospace;
  color: orangered;
}
canvas {
  margin-top: 12px;
  max-width: 640px;
  width: 100%;
}
</style>
