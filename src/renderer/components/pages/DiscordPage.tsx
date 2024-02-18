/* eslint-disable react/no-danger */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Paper } from '@mui/material';
import '../../Discord.css';

function DiscordPage() {
  const [htmlContent, setHtmlContent] = useState<string>('');

  const processHTML = (html: string) => {
    const $ = cheerio.load(html);

    // Select HTML between start and end elements
    const startElement = $('.header-19XI67');
    const endElement = $('.container-33DGro');
    let processedHTML = '';
    // Update anchor tags to open in a new browser window
    $('a').each((index, element) => {
      const anchor = $(element);
      const href = anchor.attr('href');
      if (href && href.includes('discord.gg')) {
        anchor.attr('target', '_blank');
        anchor.attr('rel', 'noopener noreferrer');
      }
    });
    $('img').each((index, element) => {
      const img = $(element);
      const src = img.attr('src');
      if (src && !src.includes('discord')) {
        img.remove();
      }
    });
    $('.tooltipContainer-1xXVjT').remove();
    $('div.sidebarCategory-Dg58Yg').removeAttr('class');
    $('div.iconContainer-37Q3pA').removeAttr('class');

    if (startElement.length && endElement.length) {
      const htmlBetween = startElement.nextUntil('.container-33DGro');
      processedHTML = $.html(htmlBetween);
    } else {
      setHtmlContent('Start and/or end elements not found.');
    }

    return { html: processedHTML };
  };

  useEffect(() => {
    const fetchHTML = async () => {
      try {
        const response = await axios.get<string>('https://evos.live/discord');
        const { html } = processHTML(response.data);
        setHtmlContent(html);
      } catch (error) {
        setHtmlContent(`Error fetching HTML: ${error}`);
      }
    };

    fetchHTML();
  }, []);

  return (
    <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </Paper>
  );
}

export default DiscordPage;
