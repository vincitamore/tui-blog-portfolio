/**
 * Migration script to add slugs to existing portfolio projects
 * Run with: pnpm tsx scripts/migrate-slugs.ts
 */

import { list, put, del } from '@vercel/blob';

interface Project {
  id: string;
  slug?: string;
  title: string;
  description: string;
  content?: string;  // Full markdown content for detailed view
  technologies: string[];
  github?: string | null;
  link?: string | null;
  image?: string;
}

function generateSlug(title: string, existingSlugs: string[]): string {
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  let uniqueSlug = slug;
  let counter = 1;
  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
}

async function migrate() {
  console.log('Starting slug migration...');

  // Find the portfolio blob
  const { blobs } = await list({ prefix: 'content/portfolio' });
  const portfolioBlob = blobs.find(b => b.pathname === 'content/portfolio.json');

  if (!portfolioBlob) {
    console.log('No portfolio.json found in blob storage');
    return;
  }

  // Fetch current data
  const response = await fetch(portfolioBlob.url);
  const projects: Project[] = await response.json();

  console.log(`Found ${projects.length} projects`);

  // Track existing slugs
  const existingSlugs: string[] = [];
  let updated = 0;

  // Add slugs to projects that don't have them
  const updatedProjects = projects.map(project => {
    if (project.slug) {
      existingSlugs.push(project.slug);
      console.log(`  ${project.title}: already has slug "${project.slug}"`);
      return project;
    }

    const slug = generateSlug(project.title, existingSlugs);
    existingSlugs.push(slug);
    updated++;
    console.log(`  ${project.title}: generated slug "${slug}"`);

    return { ...project, slug };
  });

  if (updated === 0) {
    console.log('\nNo projects needed migration');
    return;
  }

  // Delete old blob and write new one
  await del(portfolioBlob.url);
  await put('content/portfolio.json', JSON.stringify(updatedProjects, null, 2), {
    access: 'public',
    contentType: 'application/json',
  });

  console.log(`\nMigration complete: ${updated} projects updated`);
}

migrate().catch(console.error);
