function update_feed(feed, element) {
  console.log('updating feed ' + feed)
  $.get(
    feed,
    function (feeddata) {
      console.log('feed = ' + feeddata)
      var data = $(feeddata).get(1)
      feed_html = ''
      $(data)
        .find('entry,item')
        .slice(0, 5)
        .each(function () {
          console.log(this)
          feed_html = feed_html + get_item($(this))
        })

      var html = '<ul class="feed_list">' + feed_html + '</ul>'

      $('#' + element).append(html)
    },
    'jsonp',
  )
}

function get_item(elem) {
  var done = false
  link = elem.find('link');  
  if (link.attr('href')) {
    link_href = link.attr('href')
  } else {
    link_href = link.text()
  }
  
  while (!done && link != null) {    
    if ($(link).attr('rel') == 'alternate') {
      if ($(link).attr('href')) {
        link_href = $(link).attr('href')
      } else {
        link_href = $(link).text()
      }
      done = true
    } else {
        link = $(link).next();
    }
  }

  return `
      <li class="feed_item">
        <a class="feed_item_link" href="${link_href}" target="_blank" rel="noopener">
          ${elem.find('title').text()}
        </a>
      </li>
    `
}
