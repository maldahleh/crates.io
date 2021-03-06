use crate::builders::{CrateBuilder, VersionBuilder};
use crate::new_dependency;
use crate::util::{RequestHelper, TestApp};
use cargo_registry::views::EncodableDependency;
use http::StatusCode;

#[derive(Deserialize)]
struct Deps {
    dependencies: Vec<EncodableDependency>,
}

#[test]
fn dependencies() {
    let (app, anon, user) = TestApp::init().with_user();
    let user = user.as_model();

    app.db(|conn| {
        let c1 = CrateBuilder::new("foo_deps", user.id).expect_build(conn);
        let v = VersionBuilder::new("1.0.0").expect_build(c1.id, user.id, conn);
        let c2 = CrateBuilder::new("bar_deps", user.id).expect_build(conn);
        new_dependency(conn, &v, &c2);
    });

    let deps: Deps = anon
        .get("/api/v1/crates/foo_deps/1.0.0/dependencies")
        .good();
    assert_eq!(deps.dependencies[0].crate_id, "bar_deps");

    anon.get::<()>("/api/v1/crates/foo_deps/1.0.2/dependencies")
        .bad_with_status(StatusCode::OK);
}
