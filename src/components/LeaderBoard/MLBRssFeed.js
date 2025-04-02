import React, { useState, useEffect } from 'react';

// CSS can be imported from a separate file or included in your component file
const rssStyles = {
  container: {
    width: '250px',
    height: '750px',
    overflowY: 'auto',
    border: '1px solid #d4d0c8',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    backgroundColor: '#999999',
    color: '#ffffff',
    padding: '10px',
    fontWeight: 'bold',
  },
  item: {
    borderBottom: '1px solid #f1eded',
    padding: '10px',
  },
  itemEven: {
    backgroundColor: '#f1eded',
  },
  itemOdd: {
    backgroundColor: '#ffffff',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  titleLink: {
    color: '#000000',
    textDecoration: 'none',
  },
  description: {
    fontSize: '0.9em',
    color: '#000000',
  },
  loading: {
    padding: '10px',
  },
  error: {
    padding: '10px',
    color: 'red',
  }
};

const MLBRssFeed = () => {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRssFeed = async () => {
      try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const rssFeedUrl = encodeURIComponent('https://www.espn.com/espn/rss/mlb/news');
        
        const response = await fetch(`${proxyUrl}${rssFeedUrl}`);
        const data = await response.text();
        
        // Parse the XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, 'text/xml');
        
        // Extract items
        const items = xmlDoc.querySelectorAll('item');
        const parsedItems = [];
        
        items.forEach((item, index) => {
          if (index < 10) { // Limit to 10 items
            parsedItems.push({
              id: index,
              title: item.querySelector('title')?.textContent || 'No Title',
              link: item.querySelector('link')?.textContent || '#',
              description: item.querySelector('description')?.textContent || ''
            });
          }
        });
        
        setFeedItems(parsedItems);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching RSS feed:', err);
        setError('Failed to load MLB news. Please try again later.');
        setLoading(false);
      }
    };

    fetchRssFeed();
  }, []);

  if (loading) {
    return <div style={rssStyles.container}><p style={rssStyles.loading}>Loading MLB news...</p></div>;
  }

  if (error) {
    return <div style={rssStyles.container}><p style={rssStyles.error}>{error}</p></div>;
  }

  return (
    <div style={rssStyles.container}>
      <div style={rssStyles.header}>MLB News</div>
      {feedItems.map((item, index) => (
        <div 
          key={item.id} 
          style={{
            ...rssStyles.item, 
            ...(index % 2 === 0 ? rssStyles.itemEven : rssStyles.itemOdd)
          }}
        >
          <div style={rssStyles.title}>
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={rssStyles.titleLink}
            >
              {item.title}
            </a>
          </div>
          <div 
            style={rssStyles.description}
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
        </div>
      ))}
    </div>
  );
};

export default MLBRssFeed;