// La navigation horizontale reprend le meme menu que la verticale, sans les
// intitules de section qu'elle ne sait pas afficher.
import verticalItems from '@/navigation/vertical'

export default verticalItems.filter(item => !item.heading)
