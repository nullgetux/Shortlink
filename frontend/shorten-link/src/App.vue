<template>
  <div id="app">
    <h1>URL Shortener</h1>

    <!-- URL Input Form -->
    <form @submit.prevent="shortenUrl">
      <input
        type="text"
        v-model="originalUrl"
        placeholder="Enter original URL (e.g., https://example.com)"
        required
      />
      <input
        type="text"
        v-model="customShortUrl"
        placeholder="Custom short URL (optional)"
      />
      <button type="submit" :disabled="loading">
        {{ loading ? 'Shortening...' : 'Shorten' }}
      </button>
    </form>

    <!-- Display the shortened URL -->
    <div v-if="shortUrl">
      <h3>Your shortened URL:</h3>
      <a :href="shortUrl" target="_blank">{{ shortUrl }}</a>
    </div>

    <!-- Error message -->
    <div v-if="error" style="color:red">
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const originalUrl = ref('');
const customShortUrl = ref('');
const shortUrl = ref(null);
const error = ref(null);
const loading = ref(false); // Track loading state

const shortenUrl = async () => {
  if (!validUrl(originalUrl.value)) {
    error.value = 'Please enter a valid URL.';
    return;
  }

  try {
    loading.value = true;
    shortUrl.value = null;
    error.value = null;

    const response = await axios.post('http://localhost:3000/shorten', {
      original_url: originalUrl.value,
      custom_short_url: customShortUrl.value || undefined,
    });

    shortUrl.value = response.data.short_url;
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to shorten URL. Please try again.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Function to validate URL format
const validUrl = (url) => {
  const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(url);
};
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  margin-top: 50px;
}

input {
  padding: 8px;
  width: 300px;
}

button {
  padding: 8px 16px;
  margin-left: 10px;
}

button[disabled] {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
