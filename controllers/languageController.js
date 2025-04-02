export async function switchLanguage (req, res) {
    const newLang = req.params.lang;
    if (!["en", "uk"].includes(newLang)) {
        return res.status(400).send("Invalid language");
    }

    res.cookie("lang", newLang, { maxAge: 60 * 60 * 1000, httpOnly: true });
    //res.status(200).send({ message: "Language switched", lang: newLang});
    let redirectUrl = req.cookies.lastPage || "/";
    redirectUrl = redirectUrl.replace(/^\/(uk|en)/, `/${newLang}`);
    res.redirect(redirectUrl);
}
