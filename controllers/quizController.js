export async function showQuiz(req, res) {
    try {
        res.render('quiz');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading quiz");
    }
}
