import { useParams } from "react-router-dom";
import StoryTemplate from "./templates/StoryTemplate.jsx";
import { getStoryBySlug } from "./templates/storyData.js";
import StoryAtlas from "./StoryAtlas.jsx";

export default function StoryExperience() {
  const { slug } = useParams();
  const story = getStoryBySlug(slug);
  if (!story) {
    return <StoryAtlas />;
  }
  return <StoryTemplate story={story} />;
}
