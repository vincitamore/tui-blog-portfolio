import React from 'react';
import { ExternalLink, Github } from 'lucide-react';
import type { Project } from '../machines/portfolioMachine';

interface ProjectDetailProps {
  project: Project;
}

/**
 * Full project detail view component.
 * Displays complete project information with links.
 */
const ProjectDetail: React.FC<ProjectDetailProps> = ({ project }) => {
  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8 pb-4 border-b border-ansi-green/30">
        <h1 className="text-3xl font-bold mb-4">{project.title}</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="text-sm px-3 py-1 border border-ansi-green/40 text-ansi-green/80"
            >
              {tech}
            </span>
          ))}
        </div>
        <div className="flex gap-4">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-ansi-green/70 hover:text-ansi-green transition-colors"
            >
              <Github size={16} />
              GitHub
            </a>
          )}
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-ansi-green/70 hover:text-ansi-green transition-colors"
            >
              <ExternalLink size={16} />
              Live Demo
            </a>
          )}
        </div>
      </header>
      <div className="prose prose-invert prose-green max-w-none">
        <p className="text-lg text-ansi-green/90 leading-relaxed">{project.description}</p>
      </div>
      <footer className="mt-8 pt-4 border-t border-ansi-green/30 text-center text-xs text-ansi-green/60">
        Press Esc to return to projects
      </footer>
    </article>
  );
};

export default ProjectDetail;



