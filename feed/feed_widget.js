function update_feed(feed_url, element_id) {
  console.log('updating feed from ' + feed_url);
  $.ajax({
    url: feed_url,
    dataType: 'jsonp',
    success: function (data) {
      console.log('Received feed data:', data);
      let feed_html = '';
      const entries = data.feed.entry || [];
      
      entries.slice(0, 10).forEach(function(entry) {
        feed_html += get_item(entry);
      });

      const html = '<ul class="feed_list">' + feed_html + '</ul>';
      $('#' + element_id).html(html); // Use .html() to replace content
    },
    error: function(xhr, status, error) {
      console.error("Failed to load blog feed:", status, error);
      $('#' + element_id).html('<p>Could not load blog posts.</p>');
    }
  });
}

function get_item(entry) {
  let post_link = '';
  if (entry.link && Array.isArray(entry.link)) {
    const alternate_link = entry.link.find(link => link.rel === 'alternate');
    if (alternate_link) {
      post_link = alternate_link.href;
    }
  }

  const post_title = entry.title ? entry.title.$t : 'Untitled Post';

  return `
      <li class="feed_item">
        <a class="feed_item_link" href="${post_link}" target="_blank" rel="noopener">
          ${post_title}
        </a>
      </li>
    `;
}