import styles from './SkipLink.module.css';

export interface SkipLinkProps {
  /** id of the element to move to. */
  targetId: string;
  children: string;
}

/** First thing in the tab order; appears on focus and moves keyboard focus past the navigation. */
export function SkipLink({ targetId, children }: SkipLinkProps) {
  return (
    <a
      className={styles.link}
      href={`#${targetId}`}
      onClick={(e) => {
        const target = document.getElementById(targetId);
        if (!target) return;
        e.preventDefault();
        target.focus();
      }}
    >
      {children}
    </a>
  );
}
