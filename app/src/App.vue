<template>
  <div id="app">
    <json-viewer v-for="(event , k) in events.reverse()" :key="k" :value="event"/>
  </div>
</template>

<script>
import { io } from 'socket.io-client';
import JsonViewer from 'vue-json-viewer';

export default {
  name: 'App',
  components: {JsonViewer},
  data: () => ({
    events: [],
  }),
  mounted: function() {
    const socket = io('http://localhost:3000');

    socket.on("connect", () => {
      console.log('[Socket] Connecté');
    });

    socket.on("data", data => {
      this.events.unshift(data);
      console.log(data);
    });
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
