from .runner import run_workflow

if __name__ == "__main__":
    text = "We are in Galle, flood water rising fast. 15 people including elderly. Need urgent rescue."
    image_url = "https://ik.imagekit.io/SaviYa/disasters/Kegalle_Landslide_2025_5hXjXnqSYL.png"
    result = run_workflow(request_text=text, image_url=image_url)
    print("Caption:", result["caption"])
    print("Metadata:", result["metadata"])
    print("Errors:", result["errors"])
