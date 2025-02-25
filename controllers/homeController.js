export async function showHomepage(req, res) {
    try {
        res.render('homepage');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading homepage");
    }
}
