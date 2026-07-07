<?php
/**
 * Plugin Name: NexisAI SEO
 * Description: Sitemap and robots.txt tuning for nexisai.blog
 */

add_filter(
    'robots_txt',
    static function (string $output, bool $public): string {
        if (!$public) {
            return $output;
        }

        $lines = preg_split("/\r\n|\n|\r/", trim($output)) ?: [];
        $lines = array_values(array_filter(
            $lines,
            static fn (string $line): bool => stripos($line, 'Sitemap:') !== 0
        ));

        $lines[] = 'Sitemap: https://nexisai.blog/sitemap.xml';

        return implode("\n", $lines) . "\n";
    },
    99,
    2
);

add_filter(
    'wp_sitemaps_add_provider',
    static function ($provider, string $name) {
        if ($name === 'users') {
            return false;
        }

        return $provider;
    },
    10,
    2
);
